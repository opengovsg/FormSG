import { killEmailMode } from '../../../../config/config'
import { ControllerHandler } from '../../../../modules/core/core.types'

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
export const injectFeedbackFormUrl: ControllerHandler = (req, res, next) => {
  const formId = killEmailMode.feedbackFormid
  req.params = { formId: formId }
  return next()
}
