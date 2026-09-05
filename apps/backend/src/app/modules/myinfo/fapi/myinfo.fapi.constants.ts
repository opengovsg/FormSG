import config from '../../../config/config'
import { MYINFO_ROUTER_PREFIX } from '../myinfo.constants'

export const MYINFO_FAPI_REDIRECT_PATH = '/fapi/login'
export const MYINFO_FAPI_JWKS_PATH = '/fapi/.well-known/jwks.json'
export const MYINFO_FAPI_REDIRECT_URI = `${config.app.appUrl}${MYINFO_ROUTER_PREFIX}${MYINFO_FAPI_REDIRECT_PATH}`
export const MYINFO_FAPI_SESSION_COOKIE_NAME = 'MyInfoFapiSession'
export const MYINFO_FAPI_SESSION_MAX_AGE_MS = 15 * 60 * 1000 // 15 minutes
