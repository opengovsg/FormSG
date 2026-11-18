import config from '../../config/config'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'

/**
 * Top-level router prefix to be used for MyInfo routes.
 * We make this a constant because it is part of the route
 * registered with MyInfo.
 */
export const MYINFO_ROUTER_PREFIX = '/mi'

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
