import { Router } from 'express'
import type { JSONWebKeySet } from 'jose'

import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { MyInfoV5Service } from '../../modules/myinfo/v5/myinfo.v5.factory'
import { retrieveJsonContent } from '../../utils/iac'

// Handles SingPass JWKS requests
export const SpOidcJwksRouter = Router()

/**
 * Returns the RP's public json web key set (JWKS) for communication with NDI.
 *
 * In production the SPCP OIDC v1 flow and the MyInfo v5 / Singpass Auth v2 flow
 * register their own JWKS URLs separately. mockpass, however, only reads one
 * URL per IdP — so in dev (and CI) we merge both keysets here.
 *
 * @route GET /sp/.well-known/jwks.json
 * @returns 200
 */
SpOidcJwksRouter.get('/', (_req, res) => {
  const spcpJwks = retrieveJsonContent({
    preIacFilePath: spcpMyInfoConfig.spOidcRpJwksPublicPath,
    postIacJsonString: spcpMyInfoConfig.spOidcRpJwksPublic,
  }) as JSONWebKeySet | undefined

  const v5Jwks = MyInfoV5Service.getPublicJwks()
  const merged: JSONWebKeySet = {
    keys: [...(spcpJwks?.keys ?? []), ...v5Jwks.keys],
  }
  res.json(merged)
})
