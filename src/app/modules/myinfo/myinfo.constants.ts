import config from '../../../config/config'

export const MYINFO_ROUTER_PREFIX = '/myinfo'
export const MYINFO_REDIRECT_PATH = '/login'
export const MYINFO_COOKIE_NAME = 'MyInfoCookie'
export const MYINFO_COOKIE_OPTIONS = {
  // Important for security - access token cannot be read by client-side JS
  httpOnly: true,
  sameSite: 'lax' as const, // Setting to 'strict' prevents Singpass login on Safari, Firefox
  secure: !config.isDev,
}
