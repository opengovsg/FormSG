/* eslint-disable no-console */
/**
 * End-to-end wire-protocol smoke for MyInfo v5 / Singpass Auth v2 against
 * mockpass. Pure JOSE + axios — no FormSG app boot, so it can run without
 * config env vars. This is the same flow the real `MyInfoV5ServiceClass`
 * implements, kept in lockstep deliberately.
 *
 * Run:
 *   docker run --rm -d --name mockpass-smoke -p 5156:5156 \
 *     --add-host host.docker.internal:host-gateway \
 *     -e MOCKPASS_NRIC=S6005038D \
 *     -e SHOW_LOGIN_PAGE=false \
 *     -e SP_RP_JWKS_ENDPOINT=http://host.docker.internal:5099/jwks \
 *     opengovsg/mockpass:4.6.7
 *   pnpm tsx scripts/smoke-myinfo-v5.ts
 */

import axios from 'axios'
import crypto from 'crypto'
import express from 'express'
import fs from 'fs'
import http from 'http'
import * as jose from 'jose'
import path from 'path'

const ISSUER = process.env.SMOKE_ISSUER ?? 'http://localhost:5156/singpass/v2'
const CLIENT_ID = process.env.SMOKE_CLIENT_ID ?? 'mockClientId'
const REDIRECT_URI =
  process.env.SMOKE_REDIRECT_URI ?? 'http://localhost:5000/api/v3/mi/v5/login'
const JWKS_PORT = Number(process.env.SMOKE_JWKS_PORT ?? 5099)

const FIXTURES_DIR = path.resolve(
  __dirname,
  '../src/app/modules/myinfo/v5/__fixtures__/keys',
)
const publicJwks = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'dev-rp-public.json'), 'utf8'),
) as jose.JSONWebKeySet
const privateJwks = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'dev-rp-secret.json'), 'utf8'),
) as jose.JSONWebKeySet

function base64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function pickJwk(set: jose.JSONWebKeySet, use: 'sig' | 'enc'): jose.JWK {
  const k = set.keys.find((kk) => kk.use === use)
  if (!k) throw new Error(`no JWK with use=${use}`)
  return k
}

async function main(): Promise<void> {
  // 1. Publish RP JWKS for mockpass to fetch.
  const app = express()
  app.get('/jwks', (_req, res) => res.json(publicJwks))
  const server = http.createServer(app)
  await new Promise<void>((r) => server.listen(JWKS_PORT, r))
  console.log(`[smoke] RP JWKS on :${JWKS_PORT}`)

  try {
    // 2. Discovery.
    const disc = (
      await axios.get(`${ISSUER}/.well-known/openid-configuration`, {
        timeout: 5000,
      })
    ).data
    console.log('[smoke] discovery OK, userinfo:', disc.userinfo_endpoint)

    // 3. PKCE + nonce + state.
    const codeVerifier = base64url(crypto.randomBytes(48))
    const codeChallenge = base64url(
      crypto.createHash('sha256').update(codeVerifier).digest(),
    )
    const nonce = base64url(crypto.randomBytes(32))
    const state = base64url(Buffer.from(JSON.stringify({ formId: 'X' })))

    // 4. Build auth URL and follow the 302.
    const authUrl = new URL(disc.authorization_endpoint)
    authUrl.searchParams.set('client_id', CLIENT_ID)
    authUrl.searchParams.set('scope', 'openid uinfin name mobileno regadd')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('nonce', nonce)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    const authResp = await axios.get(authUrl.toString(), {
      maxRedirects: 0,
      validateStatus: (s) => s === 302,
    })
    const location = authResp.headers['location'] as string
    const code = new URL(location).searchParams.get('code')
    if (!code) throw new Error(`no code in redirect: ${location}`)
    console.log('[smoke] auth code received')

    // 5. private_key_jwt client assertion.
    const sigJwk = pickJwk(privateJwks, 'sig')
    const signingKey = (await jose.importJWK(
      sigJwk,
      'ES256',
    )) as jose.KeyLike
    const now = Math.floor(Date.now() / 1000)
    const clientAssertion = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: sigJwk.kid! })
      .setIssuer(CLIENT_ID)
      .setSubject(CLIENT_ID)
      .setAudience(disc.issuer)
      .setIssuedAt(now)
      .setExpirationTime(now + 60)
      .setJti(crypto.randomUUID())
      .sign(signingKey)

    // 6. Token exchange.
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      code_verifier: codeVerifier,
    })
    const tokenResp = await axios.post(disc.token_endpoint, tokenBody.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })
    console.log('[smoke] token_type:', tokenResp.data.token_type)

    // 7. Userinfo (Bearer per mockpass; prod uses DPoP).
    const userinfoResp = await axios.get<string>(disc.userinfo_endpoint, {
      headers: {
        authorization: `Bearer ${tokenResp.data.access_token}`,
        accept: 'application/jwt',
      },
      transformResponse: (raw) => raw,
    })
    const jwe = String(userinfoResp.data)
    console.log('[smoke] userinfo JWE length:', jwe.length)

    // 8. Decrypt + verify.
    const encJwk = pickJwk(privateJwks, 'enc')
    const encKey = (await jose.importJWK(
      encJwk,
      encJwk.alg ?? 'ECDH-ES+A256KW',
    )) as jose.KeyLike
    const { plaintext } = await jose.compactDecrypt(jwe, encKey)
    const jws = new TextDecoder().decode(plaintext)
    const idpJwks = jose.createRemoteJWKSet(new URL(disc.jwks_uri))
    const { payload } = await jose.jwtVerify(jws, idpJwks)
    console.log('[smoke] userinfo claims:', JSON.stringify(payload, null, 2))

    console.log('[smoke] OK — v5 wire protocol round-trip succeeded')
  } finally {
    server.close()
  }
}

main().catch((e) => {
  console.error('[smoke] FAILED:', e?.message ?? e)
  if (e?.response?.data) console.error('[smoke] response data:', e.response.data)
  process.exit(1)
})
