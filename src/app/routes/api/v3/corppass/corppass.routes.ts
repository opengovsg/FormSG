import express, { Router } from 'express'

import { spcpMyInfoConfig } from '../../../../config/features/spcp-myinfo.config'

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
