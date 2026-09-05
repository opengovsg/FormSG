import { Router } from 'express'

import { authCallbackForwardingMiddleware } from '../auth/auth.middlewares'

import { MyInfoFapiRouter } from './fapi/myinfo.fapi.routes'
import { MYINFO_REDIRECT_PATH } from './myinfo.constants'
import {
  handleMyInfoLogin,
  handleRedirectURLRequest,
} from './myinfo.controller'

export const MyInfoRouter = Router()

/**
 * Serves requests to supply a redirect URL to log in to
 * MyInfo.
 * @deprecated in favour of GET /api/v3/forms/:formId/auth/redirect
 */
MyInfoRouter.get('/redirect', handleRedirectURLRequest)

/**
 * Serves redirects from MyInfo after user has given consent to provide
 * their MyInfo data.
 */
MyInfoRouter.get(
  MYINFO_REDIRECT_PATH,
  authCallbackForwardingMiddleware,
  handleMyInfoLogin,
)

/**
 * MyInfo FAPI 2.0 routes, which run in parallel with MyInfo v3 during migration.
 */
MyInfoRouter.use(MyInfoFapiRouter)
