import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../../modules/core/core.types'
import { createReqMeta, getRequestIp } from '../../utils/request'

import { IntranetService } from './intranet.service'

const logger = createLoggerWithLabel(module)

export const logIntranetUsage: ControllerHandler = (req, _res, next) => {
  const isIntranet = IntranetService.isIntranetIp(getRequestIp(req))
  // Ignore case where result is err, as this means intranet feature is not enabled
  if (isIntranet) {
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
