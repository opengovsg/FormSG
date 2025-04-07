import { Router } from 'express'

import { retrieveJsonContent } from '../../../app/utils/iac'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'

// Handles SingPass JWKS requests
export const SpOidcJwksRouter = Router()

/**
 * Returns the RP's public json web key set (JWKS) for communication with NDI
 * @route GET /sp/.well-known/jwks.json
 * @returns 200
 */
SpOidcJwksRouter.get('/', (_req, res) => {
  res.json(
    retrieveJsonContent({
      preIacFilePath: spcpMyInfoConfig.spOidcRpJwksPublicPath,
      postIacJsonString: spcpMyInfoConfig.spOidcRpJwksPublic,
    }),
  )
})
