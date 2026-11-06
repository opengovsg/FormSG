import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import {
  featureFlags,
  MAX_SEND_BACK_REMARKS_LENGTH,
} from 'formsg-shared/constants'
import { FormAuthType } from 'formsg-shared/types'
import { getMultirespondentSubmissionEditPath } from 'formsg-shared/utils/urls'

import { Environment } from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
import { mapRouteError, sendRouteError } from '../submission.utils'

import { startFixingStep } from './multirespondent-submission.service'
import { checkWorkflowActionAllowed } from './workflow-actions.gate'

const logger = createLoggerWithLabel(module)

const appUrl =
  process.env.NODE_ENV === Environment.Dev
    ? config.app.feAppUrl
    : config.app.appUrl

const validateFixStepBody = celebrate({
  [Segments.BODY]: Joi.object({
    targetStepNumber: Joi.number().integer().min(1).required(),
    expectedStepNumber: Joi.number().integer().min(2).required(),
    stepOneRecipientEmail: Joi.string()
      .email()
      .lowercase()
      .when('targetStepNumber', {
        is: 1,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    submissionSecretKey: Joi.string().required(),
    remarks: Joi.string()
      .trim()
      .allow('')
      .max(MAX_SEND_BACK_REMARKS_LENGTH)
      .optional(),
  }),
})

const fixStepOfPendingMrfSubmission: ControllerHandler<
  { formId: string; submissionId: string },
  unknown,
  {
    targetStepNumber: number
    expectedStepNumber: number
    submissionSecretKey: string
    remarks?: string
    stepOneRecipientEmail?: string
  }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const {
    targetStepNumber,
    expectedStepNumber,
    submissionSecretKey,
    remarks,
    stepOneRecipientEmail,
  } = req.body
  const authedUserId = (req.session as AuthedSessionData).user._id
  const logMeta = {
    action: 'fixStepOfPendingMrfSubmission',
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
      startFixingStep({
        formId,
        formPublicKey: form.publicKey as string,
        submissionId,
        targetStepNumber,
        expectedStepNumber,
        remarks: remarks || undefined,
        stepOneRecipientEmail,
        canFixStepOne: form.authType === FormAuthType.NIL,
        actor: user,
      }).map((sentBack) => ({ form, ...sentBack })),
    )
    .map(async ({ form, stepNumber, emails, stepToken }) => {
      logger.info({
        message: 'Workflow step fix requested',
        meta: { ...logMeta, recipientCount: emails.length },
      })

      if (emails.length > 0) {
        await MailService.sendMrfWorkflowFixStepEmail({
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
            message: 'Failed to email the step to fix',
            meta: logMeta,
            error,
          }),
        )
      }

      return res.json({ stepNumber, emails })
    })
    .mapErr((error) => {
      logger.warn({
        message: 'Failed to request a step fix',
        meta: logMeta,
        error,
      })
      return sendRouteError(res, mapRouteError(error))
    })
}

export const handleFixStepOfPendingMrfSubmission = [
  validateFixStepBody,
  fixStepOfPendingMrfSubmission,
] as ControllerHandler[]
