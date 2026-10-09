import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, WorkflowEventType } from 'formsg-shared/types'
import { isWorkflowActionsEligible } from 'formsg-shared/utils/workflow-actions'
import moment from 'moment-timezone'
import { errAsync, okAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import { FormInvalidResponseModeError } from '../../form/form.errors'
import * as UserService from '../../user/user.service'
import { recordWorkflowEvent } from '../../workflow-event/workflow-event.service'
import { MrfWorkflowActionsUnavailableError } from '../submission.errors'
import { mapRouteError, sendRouteError } from '../submission.utils'

import {
  getMultirespondentSubmission,
  stopMultirespondentSubmission,
} from './multirespondent-submission.service'

const logger = createLoggerWithLabel(module)

export const MAX_STOP_NOTIFIED_EMAILS = 30

const validateStopBody = celebrate({
  [Segments.BODY]: Joi.object({
    emails: Joi.array()
      .items(Joi.string().email().lowercase())
      .unique()
      .max(MAX_STOP_NOTIFIED_EMAILS)
      .required(),
  }),
})

const stopPendingMrfSubmission: ControllerHandler<
  { formId: string; submissionId: string },
  unknown,
  { emails: string[] }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const { emails } = req.body
  const authedUserId = (req.session as AuthedSessionData).user._id
  const logMeta = {
    action: 'stopPendingMrfSubmission',
    formId,
    submissionId,
    ...createReqMeta(req),
  }

  return UserService.findUserById(authedUserId)
    .andThen((user) =>
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }).map((form) => ({ form, user })),
    )
    .andThen(({ form, user }) => {
      if (form.responseMode !== FormResponseMode.Multirespondent) {
        return errAsync(new FormInvalidResponseModeError())
      }
      if (!req.growthbook?.isOn(featureFlags.workflowActions)) {
        return errAsync(new MrfWorkflowActionsUnavailableError())
      }
      return okAsync({ form, user })
    })
    .andThen(({ form, user }) =>
      getMultirespondentSubmission(submissionId).andThen((submission) =>
        isWorkflowActionsEligible(submission.created)
          ? okAsync({ form, user })
          : errAsync(new MrfWorkflowActionsUnavailableError()),
      ),
    )
    .andThen(({ form, user }) =>
      stopMultirespondentSubmission({
        formId,
        submissionId,
        stoppedBy: String(user._id),
      }).map((submission) => ({ form, user, submission })),
    )
    .map(async ({ form, user, submission }) => {
      const stoppedAt = submission.stoppedAt as Date
      logger.info({ message: 'Workflow stopped', meta: logMeta })

      await recordWorkflowEvent({
        submission,
        type: WorkflowEventType.Stopped,
        actor: user,
        stepNumber: (submission.submittedSteps?.length ?? 0) + 1,
        emails,
      }).mapErr((error) =>
        logger.error({
          message: 'Failed to record workflow stopped event',
          meta: logMeta,
          error,
        }),
      )

      if (emails.length > 0) {
        await MailService.sendMrfWorkflowStoppedEmail({
          emails,
          formId,
          formTitle: form.title,
          responseId: submissionId,
          submissionId,
          timestamp: moment(stoppedAt)
            .tz('Asia/Singapore')
            .format('ddd, DD MMM YYYY hh:mm:ss A'),
        }).mapErr((error) =>
          logger.error({
            message: 'Failed to send workflow stopped email',
            meta: logMeta,
            error,
          }),
        )
      }

      return res.json({ stoppedAt: stoppedAt.toISOString() })
    })
    .mapErr((error) => {
      logger.warn({
        message: 'Failed to stop workflow',
        meta: logMeta,
        error,
      })
      return sendRouteError(res, mapRouteError(error))
    })
}

export const handleStopPendingMrfSubmission = [
  validateStopBody,
  stopPendingMrfSubmission,
] as ControllerHandler[]
