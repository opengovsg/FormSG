// TODO #4279: Remove after React rollout is complete
import { reactMigration } from '../../../config/config'
import { ControllerHandler } from '../../core/core.types'

export const injectAdminFeedbackFormUrl: ControllerHandler = (
  req,
  res,
  next,
) => {
  const formId = reactMigration.adminSwitchEnvFeedbackFormId
  req.params = { formId: formId }
  return next()
}

export const injectPublicFeedbackFormUrl: ControllerHandler = (
  req,
  res,
  next,
) => {
  const formId = reactMigration.publicSwitchEnvFeedbackFormId
  req.params = { formId: formId }
  return next()
}
