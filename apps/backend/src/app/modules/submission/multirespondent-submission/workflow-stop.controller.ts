import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { WorkflowEventType } from 'formsg-shared/types'
import moment from 'moment-timezone'

import { createLoggerWithLabel } from '../../../config/logger'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
import { recordWorkflowEvent } from '../../workflow-event/workflow-event.service'
import { mapRouteError, sendRouteError } from '../submission.utils'

import { stopMultirespondentSubmission } from './multirespondent-submission.service'
import { checkWorkflowActionAllowed } from './workflow-actions.gate'

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

  return checkWorkflowActionAllowed({
    userId: authedUserId,
    formId,
    submissionId,
    growthbook: req.growthbook,
  })
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
