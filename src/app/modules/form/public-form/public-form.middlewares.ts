// TODO #4279: Remove after React rollout is complete
import { reactMigration } from '../../../config/config'
import { ControllerHandler } from '../../core/core.types'

export const injectFeedbackFormUrl: ControllerHandler = (req, res, next) => {
  const formId = reactMigration.reactToAngularFeedbackFormId
  req.params = { formId: formId }
  return next()
}
