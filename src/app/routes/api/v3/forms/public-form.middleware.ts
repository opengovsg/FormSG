import { AuthedSessionData } from 'express-session'

import { killEmailMode } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import { ControllerHandler } from '../../../../modules/core/core.types'
import { createReqMeta } from '../../../../utils/request'

const logger = createLoggerWithLabel(module)

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
export const authAndInjectFeedbackFormUrl: ControllerHandler = (
  req,
  res,
  next,
) => {
  const formId = killEmailMode.feedbackFormId
  req.params = { formId: formId }
  const sessionUserId = (req.session as AuthedSessionData).user._id

  const logMeta = {
    action: 'authAndInjectFeedbackFormUrl',
    formId,
    method: req.method,
    sessionUserId,
    ...createReqMeta(req),
  }

  logger.info({
    message: 'Feedback form injected',
    meta: logMeta,
  })

  return next()
}
