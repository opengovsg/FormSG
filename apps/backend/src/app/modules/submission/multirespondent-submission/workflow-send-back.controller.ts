import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import {
  featureFlags,
  MAX_SEND_BACK_REMARKS_LENGTH,
} from 'formsg-shared/constants'
import { getMultirespondentSubmissionEditPath } from 'formsg-shared/utils/urls'

import { Environment } from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
import { mapRouteError, sendRouteError } from '../submission.utils'

import { sendBackMultirespondentSubmission } from './multirespondent-submission.service'
import { checkWorkflowActionAllowed } from './workflow-actions.gate'

const logger = createLoggerWithLabel(module)

const appUrl =
  process.env.NODE_ENV === Environment.Dev
    ? config.app.feAppUrl
    : config.app.appUrl

const validateSendBackBody = celebrate({
  [Segments.BODY]: Joi.object({
    targetStepNumber: Joi.number().integer().min(2).required(),
    expectedStepNumber: Joi.number().integer().min(3).required(),
    submissionSecretKey: Joi.string().required(),
    remarks: Joi.string()
      .trim()
      .allow('')
      .max(MAX_SEND_BACK_REMARKS_LENGTH)
      .optional(),
  }),
})

const sendBackPendingMrfSubmission: ControllerHandler<
  { formId: string; submissionId: string },
  unknown,
  {
    targetStepNumber: number
    expectedStepNumber: number
    submissionSecretKey: string
    remarks?: string
  }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const { targetStepNumber, expectedStepNumber, submissionSecretKey, remarks } =
    req.body
  const authedUserId = (req.session as AuthedSessionData).user._id
  const logMeta = {
    action: 'sendBackPendingMrfSubmission',
    formId,
    submissionId,
    targetStepNumber,
    expectedStepNumber,
    ...createReqMeta(req),
  }

  return checkWorkflowActionAllowed({
    userId: authedUserId,
    formId,
    growthbook: req.growthbook,
    flag: featureFlags.workflowActionsSendBack,
  })
    .andThen(({ form, user }) =>
      sendBackMultirespondentSubmission({
        formId,
        formPublicKey: form.publicKey as string,
        submissionId,
        targetStepNumber,
        expectedStepNumber,
        remarks: remarks || undefined,
        actor: user,
      }).map((sentBack) => ({ form, ...sentBack })),
    )
    .map(async ({ form, stepNumber, emails, stepToken }) => {
      logger.info({
        message: 'Workflow sent back',
        meta: { ...logMeta, recipientCount: emails.length },
      })

      if (emails.length > 0) {
        await MailService.sendMrfWorkflowSentBackEmail({
          emails,
          formId,
          formTitle: form.title,
          responseId: submissionId,
          responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
            formId,
            submissionId,
            { key: submissionSecretKey, stepToken },
          )}`,
          remarks: remarks || undefined,
        }).mapErr((error) =>
          logger.error({
            message: 'Failed to email the sent back step',
            meta: logMeta,
            error,
          }),
        )
      }

      return res.json({ stepNumber, emails })
    })
    .mapErr((error) => {
      logger.warn({
        message: 'Failed to send back workflow',
        meta: logMeta,
        error,
      })
      return sendRouteError(res, mapRouteError(error))
    })
}

export const handleSendBackPendingMrfSubmission = [
  validateSendBackBody,
  sendBackPendingMrfSubmission,
] as ControllerHandler[]
