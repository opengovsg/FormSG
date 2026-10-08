import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { getMultirespondentSubmissionEditPath } from 'formsg-shared/utils/urls'

import { Environment } from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
import { mapRouteError, sendRouteError } from '../submission.utils'

import { addAssigneesToPendingStep } from './multirespondent-submission.service'
import { checkWorkflowActionAllowed } from './workflow-actions.gate'

const logger = createLoggerWithLabel(module)

const appUrl =
  process.env.NODE_ENV === Environment.Dev
    ? config.app.feAppUrl
    : config.app.appUrl

export const MAX_ADDED_ASSIGNEES = 30

const validateAddAssigneesBody = celebrate({
  [Segments.BODY]: Joi.object({
    emails: Joi.array()
      .items(Joi.string().email().lowercase())
      .unique()
      .min(1)
      .max(MAX_ADDED_ASSIGNEES)
      .required(),
    submissionSecretKey: Joi.string().required(),
    stepToken: Joi.string().optional(),
  }),
})

const addAssigneesToPendingMrfSubmission: ControllerHandler<
  { formId: string; submissionId: string },
  unknown,
  { emails: string[]; submissionSecretKey: string; stepToken?: string }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const { emails, submissionSecretKey, stepToken } = req.body
  const authedUserId = (req.session as AuthedSessionData).user._id
  const logMeta = {
    action: 'addAssigneesToPendingMrfSubmission',
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
      addAssigneesToPendingStep({
        formId,
        submissionId,
        emails,
        actor: user,
      }).map(({ stepNumber }) => ({ form, stepNumber })),
    )
    .map(async ({ form, stepNumber }) => {
      logger.info({
        message: 'Assignees added to pending workflow step',
        meta: { ...logMeta, stepNumber },
      })

      await MailService.sendMRFWorkflowStepEmail({
        emails,
        formId,
        formTitle: form.title,
        responseId: submissionId,
        responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
          formId,
          submissionId,
          { key: submissionSecretKey, stepToken },
        )}`,
      }).mapErr((error) =>
        logger.error({
          message: 'Failed to email added assignees',
          meta: logMeta,
          error,
        }),
      )

      return res.json({ stepNumber, emails })
    })
    .mapErr((error) => {
      logger.warn({
        message: 'Failed to add assignees',
        meta: logMeta,
        error,
      })
      return sendRouteError(res, mapRouteError(error))
    })
}

export const handleAddAssigneesToPendingMrfSubmission = [
  validateAddAssigneesBody,
  addAssigneesToPendingMrfSubmission,
] as ControllerHandler[]
