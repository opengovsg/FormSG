import config from '../../config/config'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'

/**
 * Top-level router prefix to be used for MyInfo routes.
 * We make this a constant because it is part of the route
 * registered with MyInfo.
 */
export const MYINFO_ROUTER_PREFIX = '/myinfo'

/**
 * Path to be added after MYINFO_ROUTER_PREFIX for the login
 * route. The combination of MYINFO_ROUTER_PREFIX and
 * MYINFO_REDIRECT_PATH is the redirect endpoint registered with
 * MyInfo.
 */
export const MYINFO_REDIRECT_PATH = '/login'

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
  secure: !config.isDev,
  maxAge: spcpMyInfoConfig.spCookieMaxAge,
}

/**
 * Settings for the MyInfo auth code cookie
 */
export const MYINFO_AUTH_CODE_COOKIE_OPTIONS = {
  // Important for security - auth code cannot be read by client-side JS
  httpOnly: true,
  secure: !config.isDev,
  maxAge: MYINFO_AUTH_CODE_COOKIE_AGE_MS,
}

/**
 * Message shown on the consent page, which completes the sentence
 * "This digital service will like to request the following information
 * from Singpass, for the purpose of..."
 */
export const MYINFO_CONSENT_PAGE_PURPOSE =
  'filling out your form on form.gov.sg.'
