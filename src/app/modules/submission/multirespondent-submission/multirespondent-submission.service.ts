import { flatten } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  FieldResponsesV3,
  FormResponseMode,
  FormWorkflowDto,
  FormWorkflowStepDto,
} from '../../../../../shared/types'
import {
  IMultirespondentSubmissionSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { getMultirespondentSubmissionModel } from '../../../models/submission.server.model'
import { MailSendError } from '../../../services/mail/mail.errors'
import MailService from '../../../services/mail/mail.service'
import { transformMongoError } from '../../../utils/handle-mongo-error'
import { DatabaseError } from '../../core/core.errors'
import { isFormMultirespondent } from '../../form/form.utils'
import {
  InvalidWorkflowTypeError,
  ResponseModeError,
  SubmissionNotFoundError,
} from '../submission.errors'

import { retrieveWorkflowStepEmailAddresses } from './multirespondent-submission.utils'

const logger = createLoggerWithLabel(module)

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

export const checkFormIsMultirespondent = (
  form: IPopulatedForm,
): Result<IPopulatedMultirespondentForm, ResponseModeError> => {
  return isFormMultirespondent(form)
    ? ok(form)
    : err(
        new ResponseModeError(
          FormResponseMode.Multirespondent,
          form.responseMode,
        ),
      )
}

export const getMultirespondentSubmission = (
  submissionId: string,
): ResultAsync<
  IMultirespondentSubmissionSchema,
  DatabaseError | SubmissionNotFoundError
> =>
  ResultAsync.fromPromise(
    MultirespondentSubmission.findById(submissionId).exec(),
    (error) => {
      logger.error({
        message:
          'Error encountered while retrieving multirespondent submission',
        meta: {
          action: 'getMultirespondentSubmission',
          submissionId,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((submission) => {
    if (!submission) {
      return errAsync(new SubmissionNotFoundError())
    }
    return okAsync(submission)
  })

export const sendMrfOutcomeEmails = ({
  currentStepNumber,
  form,
  responses,
  submissionId,
}: {
  currentStepNumber: number
  form: IPopulatedMultirespondentForm
  responses: FieldResponsesV3
  submissionId: string
}): ResultAsync<true, InvalidWorkflowTypeError | MailSendError> => {
  const logMeta = {
    action: 'sendMrfOutcomeEmails',
    formId: form._id,
    submissionId,
  }
  const emailsToNotify = form.emails ?? []

  const validWorkflowStepsToNotify = (form.stepsToNotify ?? [])
    .map((stepId) =>
      form.workflow.find((step) => step._id.toString() === stepId),
    )
    .filter(
      (workflowStep) => workflowStep !== undefined,
    ) as FormWorkflowStepDto[]

  return (
    // Step 1: Fetch email address from all workflow steps that are selected to notify
    Result.combine(
      validWorkflowStepsToNotify.map((workflowStep) =>
        retrieveWorkflowStepEmailAddresses(workflowStep, responses),
      ),
    )
      .mapErr((error) => {
        logger.error({
          message: 'Failed to retrieve workflow step email addresses',
          meta: logMeta,
          error,
        })
        return error
      })
      .map((workflowStepEmailsToNotifyList) => {
        return flatten(workflowStepEmailsToNotifyList)
      })
      // Step 2: Combine static emails and workflow step emails that are selected to notify
      .map((workflowStepEmailsToNotify) => {
        return [...workflowStepEmailsToNotify, ...emailsToNotify]
      })
      // Step 3: Send outcome emails based on type
      .asyncAndThen((destinationEmails) => {
        if (!destinationEmails || destinationEmails.length <= 0)
          return okAsync(true)

        return sendMrfCompletionEmailIfWorkflowCompleted({
          currentStepNumber,
          formWorkflow: form.workflow,
          destinationEmails,
          formId: form._id,
          formTitle: form.title,
          submissionId,
        })
      })
  )
}

const sendMrfCompletionEmailIfWorkflowCompleted = ({
  currentStepNumber,
  formWorkflow,
  destinationEmails,
  formId,
  formTitle,
  submissionId,
}: {
  currentStepNumber: number
  formWorkflow: FormWorkflowDto
  destinationEmails: string[]
  formId: string
  formTitle: string
  submissionId: string
}): ResultAsync<true, MailSendError> => {
  const logMeta = {
    action: 'sendMrfCompletionEmail',
    formId,
    submissionId,
  }

  const lastStepNumber = formWorkflow.length - 1
  const isLastStep = currentStepNumber === lastStepNumber
  const isWorkflowCompleted = isLastStep

  if (isWorkflowCompleted) {
    return MailService.sendMrfWorkflowCompletionEmail({
      emails: destinationEmails,
      formId,
      formTitle,
      responseId: submissionId,
    }).orElse((error) => {
      logger.error({
        message: 'Failed to send workflow completion email',
        meta: { ...logMeta, destinationEmails },
        error,
      })
      return errAsync(error)
    })
  } else {
    return okAsync(true)
  }
}
