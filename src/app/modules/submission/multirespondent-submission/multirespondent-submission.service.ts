import { flatten, uniq } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  BasicField,
  FieldResponsesV3,
  FormResponseMode,
  FormWorkflowStepDto,
} from '../../../../../shared/types'
import { getMultirespondentSubmissionEditPath } from '../../../../../shared/utils/urls'
import {
  Environment,
  IMultirespondentSubmissionSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import { MultirespondentSubmissionDto } from '../../../../types/api'
import config from '../../../config/config'
import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import { getMultirespondentSubmissionModel } from '../../../models/submission.server.model'
import { MailSendError } from '../../../services/mail/mail.errors'
import MailService from '../../../services/mail/mail.service'
import { transformMongoError } from '../../../utils/handle-mongo-error'
import { DatabaseError } from '../../core/core.errors'
import { isFormMultirespondent } from '../../form/form.utils'
import {
  AttachmentUploadError,
  ExpectedResponseNotFoundError,
  InvalidApprovalFieldTypeError,
  InvalidWorkflowTypeError,
  ResponseModeError,
  SubmissionNotFoundError,
  SubmissionSaveError,
} from '../submission.errors'
import { uploadAttachments } from '../submission.service'
import { AttachmentMetadata } from '../submission.types'
import { reportSubmissionResponseTime } from '../submissions.statsd-client'

import { MultirespondentSubmissionContent } from './multirespondent-submission.types'
import {
  getEmailFromResponses,
  getQuestionTitleAnswerString,
  retrieveWorkflowStepEmailAddresses,
} from './multirespondent-submission.utils'

const logger = createLoggerWithLabel(module)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const appUrl =
  process.env.NODE_ENV === Environment.Dev
    ? config.app.feAppUrl
    : config.app.appUrl

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

const checkIsFormApproval = (form: IPopulatedMultirespondentForm): boolean => {
  return (
    form.workflow &&
    form.workflow.map((step) => step.approval_field).filter(Boolean).length > 0
  )
}

const checkIsStepRejected = ({
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

const sendNextStepEmail = ({
  nextStepNumber,
  form,
  formTitle,
  responseUrl,
  formId,
  submissionId,
  responses,
}: {
  nextStepNumber: number
  form: IPopulatedMultirespondentForm
  formTitle: string
  responseUrl: string
  formId: string
  submissionId: string
  responses: FieldResponsesV3
}): ResultAsync<true, InvalidWorkflowTypeError | MailSendError> => {
  const logMeta = {
    action: 'sendNextStepEmail',
    formId: formId.toString(),
    submissionId,
    nextWorkflowStep: nextStepNumber,
  }

  const nextStep = form.workflow[nextStepNumber]
  if (!nextStep) {
    return okAsync(true)
  }

  return (
    // Step 1: Retrieve email addresses for current workflow step
    retrieveWorkflowStepEmailAddresses(form, nextStep, responses)
      .mapErr((error) => {
        logger.error({
          message: 'Failed to retrieve workflow step email addresses',
          meta: logMeta,
          error,
        })
        return error
      })
      // Step 2: send out next workflow step email
      .asyncAndThen((emails) => {
        if (emails.length <= 0) {
          logger.info({
            message: 'No destination email found for MRF next step email',
            meta: logMeta,
          })
          return okAsync(true)
        }
        return MailService.sendMRFWorkflowStepEmail({
          emails,
          formTitle,
          responseId: submissionId,
          responseUrl,
        }).orElse((error) => {
          logger.error({
            message: 'Failed to send workflow email',
            meta: { ...logMeta, emails },
            error,
          })
          return errAsync(error)
        })
      })
  )
}

const sendMrfOutcomeEmails = ({
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
    formId: form._id?.toString(),
    submissionId,
  }
  const emailsToNotify =
    form.emails && Array.isArray(form.emails) ? form.emails : []

  const stepOneEmailNotificationFieldId = form.stepOneEmailNotificationFieldId
  const stepOneEmailToNotify = stepOneEmailNotificationFieldId
    ? getEmailFromResponses(stepOneEmailNotificationFieldId, responses)
    : null
  if (stepOneEmailToNotify) emailsToNotify.push(stepOneEmailToNotify)

  const stepsToNotifyUpToCurrentStep = form.workflow.slice(
    1, // exclude first step since notification is indicated by `stepOneEmailNotificationFieldId`
    currentStepNumber + 1,
  )

  const validWorkflowStepsToNotify = (form.stepsToNotify ?? [])
    .map((stepId) =>
      stepsToNotifyUpToCurrentStep.find(
        (step) => step._id.toString() === stepId,
      ),
    )
    .filter(
      (workflowStep) => workflowStep !== undefined,
    ) as FormWorkflowStepDto[]

  return (
    // Step 1: Fetch email address from all workflow steps that are selected to notify
    Result.combine(
      validWorkflowStepsToNotify.map((workflowStep) =>
        retrieveWorkflowStepEmailAddresses(form, workflowStep, responses),
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
        return uniq([...workflowStepEmailsToNotify, ...emailsToNotify])
      })
      // Step 3: Send outcome emails based on type
      .asyncAndThen((destinationEmails) => {
        if (!destinationEmails || destinationEmails.length <= 0) {
          logger.info({
            message: 'No destination email found for MRF outcome email',
            meta: logMeta,
          })
          return okAsync(true)
        }

        const lastStepNumber = form.workflow.length - 1
        const isLastStep = currentStepNumber === lastStepNumber
        const isWorkflowCompleted = isLastStep

        if (!isWorkflowCompleted && !isRejected) {
          return okAsync(true)
        }

        const formQuestionAnswers = getQuestionTitleAnswerString({
          formFields: form.form_fields,
          responses,
        })

        if (isApproval) {
          return MailService.sendMrfApprovalEmail({
            emails: destinationEmails,
            formId: form._id,
            formTitle: form.title,
            responseId: submissionId,
            isRejected,
            formQuestionAnswers,
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
          formQuestionAnswers,
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

const saveAttachmentsToDbIfExists = ({
  formId,
  attachments,
}: {
  formId: string
  attachments: MultirespondentSubmissionDto['attachments']
}): ResultAsync<AttachmentMetadata, AttachmentUploadError> => {
  return attachments
    ? uploadAttachments(formId, attachments)
    : okAsync(new Map<string, string>())
}

export const createMultiRespondentFormSubmission = ({
  form,
  encryptedPayload,
  logMeta,
}: {
  form: IPopulatedMultirespondentForm
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
}): ResultAsync<
  IMultirespondentSubmissionSchema & { _id: mongoose.Types.ObjectId },
  AttachmentUploadError | SubmissionSaveError
> => {
  logMeta = {
    ...logMeta,
    action: 'createMultiRespondentFormSubmission',
  }

  return saveAttachmentsToDbIfExists({
    formId: form._id,
    attachments: encryptedPayload.attachments,
  })
    .andThen((attachmentMetadata) => {
      // Create Incoming Submission
      const {
        submissionPublicKey,
        encryptedSubmissionSecretKey,
        encryptedContent,
        responseMetadata,
        version,
        mrfVersion,
      } = encryptedPayload

      const submissionContent: MultirespondentSubmissionContent = {
        form: form._id,
        authType: form.authType,
        myInfoFields: form.getUniqueMyInfoAttrs(),
        form_fields: form.form_fields,
        form_logics: form.form_logics,
        workflow: form.workflow,
        submissionPublicKey,
        encryptedSubmissionSecretKey,
        encryptedContent,
        attachmentMetadata,
        version,
        workflowStep: 0,
        mrfVersion,
      }

      const submission = new MultirespondentSubmission(submissionContent)

      return ResultAsync.fromPromise(
        submission.save().then(() => ({
          submission,
          responseMetadata,
        })),
        (error) => {
          logger.error({
            message: 'Multirespondent submission save error',
            meta: logMeta,
            error,
          })
          return new SubmissionSaveError()
        },
      )
    })
    .map(({ submission, responseMetadata }) => {
      const submissionId = submission.id
      logger.info({
        message: 'Saved submission to MongoDB',
        meta: { ...logMeta, submissionId, responseMetadata },
      })

      // TODO 6395 make responseMetadata mandatory
      if (responseMetadata) {
        reportSubmissionResponseTime(responseMetadata, {
          mode: 'multirespodent',
          payment: 'false',
        })
      }

      return submission
    })
}

export const performMultiRespondentPostSubmissionCreateActions = ({
  submissionId,
  form,
  encryptedPayload,
  logMeta,
}: {
  submissionId: string
  form: IPopulatedMultirespondentForm
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
}): ResultAsync<boolean, InvalidWorkflowTypeError | MailSendError> => {
  const { submissionSecretKey, responses } = encryptedPayload
  const currentStepNumber = 0

  logMeta = {
    ...logMeta,
    action: 'performMultiRespondentPostSubmissionCreateActions',
    currentWorkflowStep: currentStepNumber,
    formId: form._id,
    submissionId,
  }

  return sendNextStepEmail({
    nextStepNumber: currentStepNumber + 1, // we want to send emails to the addresses linked to the next step of the workflow
    form,
    formTitle: form.title,
    responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
      form._id,
      submissionId,
      { key: submissionSecretKey },
    )}`,
    formId: form._id,
    submissionId,
    responses,
  })
    .mapErr((error) => {
      logger.error({
        message: 'Send multirespondent workflow email error',
        meta: logMeta,
        error,
      })
      return error
    })
    .andThen(() => {
      return sendMrfOutcomeEmails({
        currentStepNumber,
        form,
        responses,
        submissionId,
      })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Send mrf outcome email error',
        meta: logMeta,
        error,
      })
      return error
    })
}

export const updateMultiRespondentFormSubmission = ({
  submissionId,
  form,
  encryptedPayload,
  logMeta,
}: {
  formId: string
  submissionId: string
  form: IPopulatedMultirespondentForm
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
}): ResultAsync<
  IMultirespondentSubmissionSchema & { _id: mongoose.Types.ObjectId },
  AttachmentUploadError | SubmissionSaveError | SubmissionNotFoundError
> => {
  logMeta = {
    ...logMeta,
    action: 'updateMultiRespondentFormSubmission',
  }

  return saveAttachmentsToDbIfExists({
    formId: form._id,
    attachments: encryptedPayload.attachments,
  })
    .map(async (attachmentMetadata) => {
      const submission = await MultirespondentSubmission.findById(submissionId)
      return { submission, attachmentMetadata }
    })
    .andThen(({ submission, attachmentMetadata }) => {
      if (!submission) {
        logger.error({
          message: 'Submission not found',
          meta: { ...logMeta, submissionId },
        })
        return errAsync(new SubmissionNotFoundError())
      }
      return okAsync({ submission, attachmentMetadata })
    })
    .andThen(({ submission, attachmentMetadata }) => {
      const {
        responseMetadata,
        submissionPublicKey,
        encryptedSubmissionSecretKey,
        encryptedContent,
        version,
        workflowStep,
        mrfVersion,
      } = encryptedPayload

      submission.responseMetadata = responseMetadata
      submission.submissionPublicKey = submissionPublicKey
      submission.encryptedSubmissionSecretKey = encryptedSubmissionSecretKey
      submission.encryptedContent = encryptedContent
      submission.version = version
      submission.workflowStep = workflowStep
      submission.attachmentMetadata = attachmentMetadata
      submission.mrfVersion = mrfVersion

      return ResultAsync.fromPromise(
        submission.save().then(() => ({ submission, responseMetadata })),
        (error) => {
          logger.error({
            message: 'Multirespondent submission save error',
            meta: logMeta,
            error,
          })
          return new SubmissionSaveError()
        },
      )
    })
    .map(({ submission, responseMetadata }) => {
      logger.info({
        message: 'Saved submission to MongoDB',
        meta: { ...logMeta, submissionId: submission.id, responseMetadata },
      })

      return submission
    })
}

export const performMultiRespondentPostSubmissionUpdateActions = ({
  submissionId,
  form,
  currentStepNumber,
  encryptedPayload,
  logMeta,
}: {
  submissionId: string
  form: IPopulatedMultirespondentForm
  currentStepNumber: number
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
}): ResultAsync<
  boolean,
  | InvalidWorkflowTypeError
  | MailSendError
  | ExpectedResponseNotFoundError
  | InvalidApprovalFieldTypeError
> => {
  const { responses, submissionSecretKey } = encryptedPayload

  logMeta = {
    ...logMeta,
    action: 'performMultiRespondentPostSubmissionUpdateActions',
    currentWorkflowStep: currentStepNumber,
    formId: form._id,
    submissionId,
  }

  const isStepRejectedResult = checkIsStepRejected({
    zeroIndexedStepNumber: currentStepNumber,
    form,
    responses,
  }).mapErr((error) => {
    logger.error({
      message: 'Error checking if step is rejected',
      meta: logMeta,
      error,
    })
    return error
  })

  if (isStepRejectedResult.isErr()) {
    logger.error({
      message: 'Error checking if step is rejected',
      meta: logMeta,
      error: isStepRejectedResult.error,
    })
    return errAsync(isStepRejectedResult.error)
  }

  const isStepRejected = isStepRejectedResult.value

  if (isStepRejected) {
    return sendMrfOutcomeEmails({
      currentStepNumber,
      form,
      responses,
      submissionId,
      isApproval: true,
      isRejected: true,
    }).mapErr((error) => {
      logger.error({
        message: 'Send mrf outcome email error',
        meta: logMeta,
        error,
      })
      return error
    })
  }
  return sendMrfOutcomeEmails({
    currentStepNumber,
    form,
    responses,
    submissionId,
    isApproval: checkIsFormApproval(form),
  })
    .mapErr((error) => {
      logger.error({
        message: 'Send mrf outcome email error',
        meta: logMeta,
        error,
      })
      return error
    })
    .andThen(() =>
      sendNextStepEmail({
        nextStepNumber: currentStepNumber + 1,
        form,
        formTitle: form.title,
        responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
          form._id,
          submissionId,
          { key: submissionSecretKey },
        )}`,
        formId: form._id,
        submissionId,
        responses,
      }).mapErr((error) => {
        logger.error({
          message: 'Send multirespondent workflow email error',
          meta: logMeta,
          error,
        })
        return error
      }),
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
