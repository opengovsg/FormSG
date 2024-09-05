import { flatten } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  BasicField,
  FieldResponsesV3,
  FormResponseMode,
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
  ExpectedResponseNotFoundError,
  InvalidApprovalFieldTypeError,
  InvalidWorkflowTypeError,
  ResponseModeError,
  SubmissionNotFoundError,
} from '../submission.errors'

import { retrieveWorkflowStepEmailAddresses } from './multirespondent-submission.utils'

const logger = createLoggerWithLabel(module)

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

export const checkIsStepRejected = ({
  zeroIndexedStepNumber,
  form,
  responses,
}: {
  zeroIndexedStepNumber: number
  form: IPopulatedMultirespondentForm
  responses: FieldResponsesV3
}): Result<
  boolean,
  ExpectedResponseNotFoundError | InvalidApprovalFieldTypeError
> => {
  const currentStep = form.workflow[zeroIndexedStepNumber]
  if (!currentStep) {
    return ok(false)
  }
  const approvalFieldId = currentStep.approval_field
  const isApprovalStep = !!approvalFieldId

  if (!isApprovalStep) {
    return ok(false)
  }

  const approvalFieldResponse = responses[approvalFieldId]
  if (!approvalFieldResponse || !approvalFieldResponse.answer) {
    return err(new ExpectedResponseNotFoundError())
  }
  if (approvalFieldResponse.fieldType !== BasicField.YesNo) {
    return err(new InvalidApprovalFieldTypeError())
  }

  return ok(approvalFieldResponse.answer === 'No')
}

export const checkIsFormApproval = (
  form: IPopulatedMultirespondentForm,
): boolean => {
  return (
    form.workflow.map((step) => step.approval_field).filter(Boolean).length > 0
  )
}

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
  isApproval = false,
  isRejected = false,
}: {
  currentStepNumber: number
  form: IPopulatedMultirespondentForm
  responses: FieldResponsesV3
  submissionId: string
  isApproval?: boolean
  isRejected?: boolean
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

        const lastStepNumber = form.workflow.length - 1
        const isLastStep = currentStepNumber === lastStepNumber
        const isWorkflowCompleted = isLastStep

        if (!isWorkflowCompleted && !isRejected) {
          return okAsync(true)
        }

        if (isApproval) {
          return MailService.sendMrfApprovalEmail({
            emails: destinationEmails,
            formId: form._id,
            formTitle: form.title,
            responseId: submissionId,
            isRejected,
          }).orElse((error) => {
            logger.error({
              message: 'Failed to send approval email',
              meta: {
                action: 'sendMrfApprovalEmail',
                formId: form._id,
                submissionId,
              },
              error,
            })
            return errAsync(error)
          })
        }
        return MailService.sendMrfWorkflowCompletionEmail({
          emails: destinationEmails,
          formId: form._id,
          formTitle: form.title,
          responseId: submissionId,
        }).orElse((error) => {
          logger.error({
            message: 'Failed to send workflow completion email',
            meta: {
              action: 'sendMrfWorkflowCompletionEmail',
              formId: form._id,
              submissionId,
            },
            error,
          })
          return errAsync(error)
        })
      })
  )
}
