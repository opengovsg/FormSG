import express, { Router } from 'express'

import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'

// Handles SingPass JWKS requests
export const SpOidcJwksRouter = Router()

/**
 * Returns the RP's public json web key set (JWKS) for communication with NDI
 * @route GET /sp/.well-known/jwks.json
 * @returns 200
 */

SpOidcJwksRouter.get(
  '/',
  express.static(spcpMyInfoConfig.spOidcRpJwksPublicPath),
)
