import { AuthedSessionData } from 'express-session'

import { TEST_EMAIL_MODE_DEPRECATION_FEEDBACK_FORM_ID } from '../../../../../../shared/constants'
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
  if (process.env.NODE_ENV === 'test') {
    req.params = { formId: TEST_EMAIL_MODE_DEPRECATION_FEEDBACK_FORM_ID }
    return next()
  }
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
