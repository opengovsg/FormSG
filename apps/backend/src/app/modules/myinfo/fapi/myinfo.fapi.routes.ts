import { Router } from 'express'

import { authCallbackForwardingMiddleware } from '../../auth/auth.middlewares'

import { getPublicJwks } from './myinfo.fapi.client'
import {
  MYINFO_FAPI_JWKS_PATH,
  MYINFO_FAPI_REDIRECT_PATH,
} from './myinfo.fapi.constants'
import { handleMyInfoFapiLogin } from './myinfo.fapi.controller'

export const MyInfoFapiRouter = Router()

/**
 * Handle redirects from Singpass after the respondent consent
 * @route GET /mi/fapi/login
 */
MyInfoFapiRouter.get(
  MYINFO_FAPI_REDIRECT_PATH,
  authCallbackForwardingMiddleware,
  handleMyInfoFapiLogin,
)

/**
 * Service public JWKS endpoint for Singpass authorization server to fetch
 * @route GET /mi/fapi/.well-known/jwks.json
 */
MyInfoFapiRouter.get(MYINFO_FAPI_JWKS_PATH, (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600').json(getPublicJwks())
})
