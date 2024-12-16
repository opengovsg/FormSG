import { Router } from 'express'

import { formSgSdkJwksConfig } from '../../config/features/formsg-sdk-jwks.config'
import { createLoggerWithLabel } from '../../config/logger'

export const WellKnownRouter = Router()

const logger = createLoggerWithLabel(module)
/**
 * Returns the FormSG's public json web key set (JWKS) for communication with FormSG SDK
 * @route GET /.well-known/formsg/jwks.json
 * @returns 200
 */
WellKnownRouter.get('/formsg/jwks.json', (req, res) => {
  logger.info({
    message: 'Admin attempting to make changes',
    meta: {
      action: 'formsg/jwks.json',
      publicJwks: formSgSdkJwksConfig.publicJwks,
    },
  })

  return res.send(formSgSdkJwksConfig.publicJwks)
})
