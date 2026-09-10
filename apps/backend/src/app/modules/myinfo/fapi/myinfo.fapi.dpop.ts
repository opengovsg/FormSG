import * as client from 'openid-client'

import {
  exportPrivateJwk,
  importEcSigningKey,
  importEcVerificationKey,
} from './myinfo.fapi.jwks'

/**
 * DPoP should be ≤2 minutes after iat
 * @see {@link https://docs.developer.singpass.gov.sg/docs/technical-specifications/technical-concepts/demonstrating-proof-of-possession-dpop}
 */
const DPOP_EXPIRY_SECONDS = 120

export type MyInfoFapiDpopKey = {
  keyPair: CryptoKeyPair
  privateJwk: JsonWebKey
}

/**
 * Generates a per-login DPoP key pair and the private JWK to persist across
 * the redirect. The public key is extractable so oauth4webapi can put it in
 * the proof; the private key is not.
 */
export const generateDpopKey = async (): Promise<MyInfoFapiDpopKey> => {
  const keyPair = await client.randomDPoPKeyPair('ES256', {
    extractable: true,
  })
  return {
    keyPair,
    privateJwk: await exportPrivateJwk(keyPair.privateKey),
  }
}

export const dpopOptions = (
  config: client.Configuration,
  keyPair: CryptoKeyPair,
): client.DPoPOptions => {
  return {
    DPoP: client.getDPoPHandle(config, keyPair, {
      [client.modifyAssertion]: (_header, payload) => {
        if (typeof payload.iat === 'number') {
          payload.exp = payload.iat + DPOP_EXPIRY_SECONDS
        }
      },
    }),
  }
}

/**
 * Rehydrates a DPoP key pair from a private JWK.
 * Converts the private JWK to a CryptoKeyPair.
 */
export const rehydrateDpopKeyPair = async (
  jwk: JsonWebKey,
): Promise<CryptoKeyPair> => {
  const privateKey = await importEcSigningKey(jwk)
  const publicKey = await importEcVerificationKey(jwk)
  return { privateKey, publicKey }
}
