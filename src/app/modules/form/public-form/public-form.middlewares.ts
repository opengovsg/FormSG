// TODO #4279: Remove after React rollout is complete
import { get, omit } from 'lodash'

import { reactMigration } from '../../../config/config'
import { ControllerHandler } from '../../core/core.types'

export const injectFeedbackFormUrl: ControllerHandler = (req, res, next) => {
  const formId =
    get(req.query, 'view') === 'admin'
      ? reactMigration.adminSwitchEnvFeedbackFormId
      : reactMigration.respondentSwitchEnvFeedbackFormId
  req.params = { formId: formId }
  req.query = omit(req.query as object, 'view')
  return next()
}
