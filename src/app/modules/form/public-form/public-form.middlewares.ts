// TODO #4279: Remove after React rollout is complete
import { StatusCodes } from 'http-status-codes'

import { reactMigration } from '../../../config/config'
import { ControllerHandler } from '../../core/core.types'

export const injectFeedbackFormUrl: ControllerHandler = (req, res, next) => {
  const formId = reactMigration.reactToAngularFeedbackFormId
  if (!formId) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'No feedback form id provided' })
  }
  req.params = { formId: formId }
  return next()
}
