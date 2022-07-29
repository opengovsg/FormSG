import express, { Router } from 'express'

import { FormAuthType } from '../../../../../../shared/types'
import { spcpMyInfoConfig } from '../../../../config/features/spcp-myinfo.config'
import * as SpcpController from '../../../../modules/spcp/spcp.controller'
import { spcpOidcLoginParamsMiddleware } from '../../../../modules/spcp/spcp.middlewares'

// Handles CorpPass OIDC requests

export const CorppassOidcRouter = Router()

/**
 * Returns the RP's public json web key set (JWKS) for communication with NDI
 * @route GET api/v3/corppass/.well-known/jwks.json
 * @returns 200
 */
CorppassOidcRouter.use(
  '/.well-known/jwks.json',
  express.static(spcpMyInfoConfig.cpOidcRpJwksPublicPath),
)

/**
 * Handles form login after user has completed authentication on cp oidc
 * @param state callback state from corppass OIDC which contains formId, rememberMe, and encodedQuery
 * @param code authorisation code from corppass OIDC which is used to exchange for id token
 * @route GET /api/v3/corppass/login
 * @returns 302 redirects to form with cp jwt
 * @returns 400 if token exchange fails
 * @returns 400 if parse state fails
 * @returns 404 if form not found
 */
CorppassOidcRouter.get(
  '/login',
  spcpOidcLoginParamsMiddleware,
  SpcpController.handleSpcpOidcLogin(FormAuthType.CP),
)
