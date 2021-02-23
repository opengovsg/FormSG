import config from '../../../config/config'

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
 * Name of cookie which contains state of MyInfo login, and access
 * token if login was successful.
 */
export const MYINFO_COOKIE_NAME = 'MyInfoCookie'

/**
 * Settings for the MyInfo cookie which contains the access token
 */
export const MYINFO_COOKIE_OPTIONS = {
  // Important for security - access token cannot be read by client-side JS
  httpOnly: true,
  sameSite: 'lax' as const, // Setting to 'strict' prevents Singpass login on Safari, Firefox
  secure: !config.isDev,
}

/**
 * Message shown on the consent page, which completes the sentence
 * "This digital service will like to request the following information
 * from Singpass, for the purpose of..."
 */
export const MYINFO_CONSENT_PAGE_PURPOSE =
  'filling out your form on form.gov.sg.'
