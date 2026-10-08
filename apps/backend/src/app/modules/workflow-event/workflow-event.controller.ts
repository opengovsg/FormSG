import { AuthedSessionData } from 'express-session'
import { FormResponseMode, WorkflowEventDto } from 'formsg-shared/types'
import { errAsync, okAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import * as AuthService from '../auth/auth.service'
import { ControllerHandler } from '../core/core.types'
import { PermissionLevel } from '../form/admin-form/admin-form.types'
import { FormInvalidResponseModeError } from '../form/form.errors'
import { mapRouteError, sendRouteError } from '../submission/submission.utils'
import * as UserService from '../user/user.service'

import { getWorkflowEvents } from './workflow-event.service'

const logger = createLoggerWithLabel(module)

export const handleGetWorkflowEvents: ControllerHandler<
  { formId: string; submissionId: string },
  WorkflowEventDto[] | { message: string }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const authedUserId = (req.session as AuthedSessionData).user._id

  return UserService.findUserById(authedUserId)
    .andThen((user) =>
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }),
    )
    .andThen((form) =>
      form.responseMode === FormResponseMode.Multirespondent
        ? okAsync(form)
        : errAsync(new FormInvalidResponseModeError()),
    )
    .andThen(() => getWorkflowEvents({ formId, submissionId }))
    .map((events) => res.json(events))
    .mapErr((error) => {
      logger.warn({
        message: 'Failed to get workflow events',
        meta: {
          action: 'handleGetWorkflowEvents',
          formId,
          submissionId,
          ...createReqMeta(req),
        },
        error,
      })
      return sendRouteError(res, mapRouteError(error))
    })
}
