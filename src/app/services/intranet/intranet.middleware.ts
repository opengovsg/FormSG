import { RequestHandler } from 'express'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta, getRequestIp } from '../../utils/request'

import { IntranetFactory } from './intranet.factory'

const logger = createLoggerWithLabel(module)

export const logIntranetUsage: RequestHandler = (req, _res, next) => {
  const isIntranetResult = IntranetFactory.isIntranetIp(getRequestIp(req))
  // Ignore case where result is err, as this means intranet feature is not enabled
  if (isIntranetResult.isOk() && isIntranetResult.value) {
    logger.info({
      message: 'Request originated from SGProxy',
      meta: {
        action: 'logIntranetUsage',
        ...createReqMeta(req),
      },
    })
  }
  return next()
}
