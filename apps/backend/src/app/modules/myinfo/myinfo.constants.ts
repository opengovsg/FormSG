import config from '../../config/config'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'

/**
 * Top-level router prefix to be used for MyInfo routes.
 * We make this a constant because it is part of the route
 * registered with MyInfo.
 */
export const MYINFO_ROUTER_PREFIX = '/mi'

/**
 * Path to be added after MYINFO_ROUTER_PREFIX for the login
 * route. The combination of MYINFO_ROUTER_PREFIX and
 * MYINFO_REDIRECT_PATH is the redirect endpoint registered with
 * MyInfo.
 */
export const MYINFO_REDIRECT_PATH = '/login'

/**
 * Callback path for the Singpass Auth API v5 / MyInfo v5 flow. Registered as a
 * separate redirect URI with Singpass so v3 and v5 callbacks can co-exist
 * during the flag-gated rollout.
 */
export const MYINFO_V5_REDIRECT_PATH = '/v5/login'

/**
 * Path under MYINFO_ROUTER_PREFIX that serves the RP public JWKS for v5.
 * Singpass (and mockpass in dev) fetches this to verify client_assertion
 * signatures and to encrypt the userinfo JWE.
 */
export const MYINFO_V5_JWKS_PATH = '/v5/.well-known/jwks.json'

/**
 * Name of cookie which passes the OAuth authorisation code
 * from the /myinfo/login endpoint to the public form endpoint.
 */
export const MYINFO_AUTH_CODE_COOKIE_NAME = 'MyInfoAuthCode'

/**
 * Lifetime in ms of cookie containing auth code, which is used
 * to pass the auth code from the /myinfo/login endpoint to the
 * public form endpoint.
 */
export const MYINFO_AUTH_CODE_COOKIE_AGE_MS = 2 * 60 * 1000

/**
 * Name of cookie which contains state of MyInfo login, and access
 * token if login was successful.
 */
export const MYINFO_LOGIN_COOKIE_NAME = 'MyInfoCookie'

/**
 * Settings for the MyInfo cookie which contains the access token
 */
export const MYINFO_LOGIN_COOKIE_OPTIONS = {
  // Important for security - access token cannot be read by client-side JS
  httpOnly: true,
  sameSite: 'lax' as const, // Setting to 'strict' prevents Singpass login on Safari, Firefox
  secure: !config.isDevOrTest,
  maxAge: spcpMyInfoConfig.spCookieMaxAge,
}

/**
 * Settings for the MyInfo auth code cookie
 */
export const MYINFO_AUTH_CODE_COOKIE_OPTIONS = {
  // Important for security - auth code cannot be read by client-side JS
  httpOnly: true,
  secure: !config.isDevOrTest,
  maxAge: MYINFO_AUTH_CODE_COOKIE_AGE_MS,
}

/**
 * Cookie that carries the PKCE code_verifier from the redirect-URL endpoint to
 * the v5 OAuth callback. Required because v5 mandates PKCE (RFC 7636) — the
 * verifier is generated when we send the user off to Singpass and must be
 * presented when we redeem the auth code at the token endpoint.
 */
export const MYINFO_V5_PKCE_COOKIE_NAME = 'MyInfoV5Pkce'

export const MYINFO_V5_PKCE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: !config.isDevOrTest,
  // Same TTL as the auth code cookie — both are tied to a single login round-trip.
  maxAge: MYINFO_AUTH_CODE_COOKIE_AGE_MS,
}

/**
 * Message shown on the consent page, which completes the sentence
 * "This digital service will like to request the following information
 * from Singpass, for the purpose of..."
 */
export const MYINFO_CONSENT_PAGE_PURPOSE =
  'filling out your form on form.gov.sg.'
