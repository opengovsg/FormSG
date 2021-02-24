import { Router } from 'express'

import { MYINFO_REDIRECT_PATH } from './myinfo.constants'
import {
  handleEServiceIdCheck,
  handleMyInfoLogin,
  handleRedirectURLRequest,
} from './myinfo.controller'

export const MyInfoRouter = Router()

/**
 * Serves requests to supply a redirect URL to log in to
 * MyInfo.
 */
MyInfoRouter.get('/redirect', handleRedirectURLRequest)

/**
 * Serves requests to validate a MyInfo form's SingPass e-service ID.
 */
MyInfoRouter.get('/validate', handleEServiceIdCheck)

/**
 * Serves redirects from MyInfo after user has given consent to provide
 * their MyInfo data.
 */
MyInfoRouter.get(MYINFO_REDIRECT_PATH, handleMyInfoLogin)
