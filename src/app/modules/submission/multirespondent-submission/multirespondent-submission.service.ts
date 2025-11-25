import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import Mail from 'nodemailer/lib/mailer'

import {
  BasicField,
  FieldResponsesV3,
  FormFieldDto,
  FormResponseMode,
  FormWorkflowStepDto,
  SubmittedApprovalStep,
  SubmittedNonApprovalStep,
  SubmittedStep,
  WorkflowStatus,
} from '../../../../../shared/types'
import { getMultirespondentSubmissionEditPath } from '../../../../../shared/utils/urls'
import {
  Environment,
  FormFieldSchema,
  IAttachmentInfo,
  IMultirespondentSubmissionSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import {
  MultirespondentSubmissionDto,
  SnapshottedFormDef,
} from '../../../../types/api'
import config from '../../../config/config'
import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import { getMultirespondentSubmissionModel } from '../../../models/submission.server.model'
import {
  AutoreplyPdfGenerationError,
  MailSendError,
} from '../../../services/mail/mail.errors'
import MailService from '../../../services/mail/mail.service'
import { generateAutoreplyPdf } from '../../../services/mail/mail.utils'
import { transformMongoError } from '../../../utils/handle-mongo-error'
import { DatabaseError } from '../../core/core.errors'
import { isFormMultirespondent } from '../../form/form.utils'
import { WebhookFactory } from '../../webhook/webhook.factory'
import {
  AttachmentUploadError,
  ExpectedResponseNotFoundError,
  InvalidApprovalFieldTypeError,
  InvalidWorkflowTypeError,
  MrfReminderInvalidWorkflowStepError,
  MrfReminderRecipientEmailsEmptyError,
  ResponseModeError,
  SubmissionNotFoundError,
  SubmissionSaveError,
} from '../submission.errors'
import { uploadAttachments } from '../submission.service'
import { AttachmentMetadata } from '../submission.types'
import { getMrfSubmissionWorkflowStatus } from '../submission.utils'
import { reportSubmissionResponseTime } from '../submissions.statsd-client'

import { MultirespondentSubmissionContent } from './multirespondent-submission.types'
import {
  extractRespondentCopyEmailDatas,
  getEmailFromResponses,
  getQuestionAnswerPairsForMultipleFields,
  getResponsesDataFromMrfResponses,
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

const checkIsFormApproval = (
  form: Pick<IPopulatedMultirespondentForm, 'workflow'>,
): boolean => {
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
  form: Pick<IPopulatedMultirespondentForm, 'workflow'>
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

interface sendNextStepEmailProps {
  nextStepNumber: number
  form: Pick<IPopulatedMultirespondentForm, 'workflow'> & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
  formTitle: string
  responseUrl: string
  formId: string
  submissionId: string
  responses: FieldResponsesV3
}

const sendNextStepEmail = ({
  nextStepNumber,
  form,
  formTitle,
  responseUrl,
  formId,
  submissionId,
  responses,
}: sendNextStepEmailProps): ResultAsync<
  true,
  InvalidWorkflowTypeError | MailSendError
> => {
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

export const getPendingStepRecipientEmailsFromSubmittedStepsMeta = ({
  submissionId,
}: {
  submissionId: string
}): ResultAsync<
  { recipientEmails: string[]; reminderStepNumber: number },
  | DatabaseError
  | SubmissionNotFoundError
  | MrfReminderInvalidWorkflowStepError
  | MrfReminderRecipientEmailsEmptyError
> => {
  return getMultirespondentSubmission(submissionId).andThen(
    ({ workflow, submittedSteps }) => {
      const logMeta = {
        action: 'getPendingStepRecipientEmailsFromSubmittedStepsMeta',
        submissionId,
        submittedSteps,
      }

      const isPending =
        submittedSteps &&
        submittedSteps.length > 0 &&
        getMrfSubmissionWorkflowStatus(
          submittedSteps as SubmittedStep[],
          workflow.length,
        ) === WorkflowStatus.PENDING

      const pendingStep = isPending
        ? submittedSteps[submittedSteps.length - 1]
        : null

      if (!pendingStep || !submittedSteps) {
        logger.error({
          message:
            'Failed to find details for pending step to send mrf next step submission reminder email',
          meta: { ...logMeta, isPending },
        })
        return errAsync(new MrfReminderInvalidWorkflowStepError())
      }

      const recipientEmails = pendingStep.nextStepRecipientEmails

      if (!recipientEmails) {
        logger.error({
          message:
            'No recipient emails found to send mrf next step submission reminder email',
          meta: logMeta,
        })
        return errAsync(new MrfReminderRecipientEmailsEmptyError())
      }

      const reminderStepNumber = submittedSteps.length + 1

      return okAsync({ recipientEmails, reminderStepNumber })
    },
  )
}

interface SendNextStepReminderEmailProps {
  senderEmail: string
  submissionId: string
  emails: string[]
  formTitle: string
  responseUrl: string
  formId: string
  reminderStepNumber: number
}

export const sendNextStepReminderEmail = ({
  senderEmail,
  submissionId,
  emails,
  responseUrl,
  formId,
  formTitle,
  reminderStepNumber,
}: SendNextStepReminderEmailProps) => {
  const logMeta = {
    action: 'sendNextStepReminderEmail',
    formId: formId.toString(),
    submissionId,
    recipientEmails: emails,
    reminderStepNumber,
    senderEmail,
  }

  logger.info({
    message: 'Sending reminder emails to pending step for MRF submission',
    meta: logMeta,
  })

  return MailService.sendMRFWorkflowStepEmail({
    emails,
    formTitle,
    responseId: submissionId,
    responseUrl,
    isReminder: true,
  }).orElse((error) => {
    logger.error({
      message: 'Failed to send reminder workflow email',
      meta: { ...logMeta, emails },
      error,
    })
    return errAsync(error)
  })
}

const getEmailsToNotifyAboutMrfOutcome = ({
  form,
  responses,
  currentStepNumber,
  submissionId,
}: {
  form: Pick<
    IPopulatedMultirespondentForm,
    | '_id'
    | 'emails'
    | 'stepOneEmailNotificationFieldId'
    | 'stepsToNotify'
    | 'workflow'
  > & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
  responses: FieldResponsesV3
  currentStepNumber: number
  submissionId: string
}): Result<string[], InvalidWorkflowTypeError> => {
  const logMeta = {
    action: 'getMrfOutcomeEmailsToNotify',
    formId: form._id?.toString(),
    submissionId,
  }

  // Emails to notify under the 'others' setting
  const othersEmailsToNotify =
    form.emails && Array.isArray(form.emails) ? form.emails : []

  // Emails to notify under the 'Respondent in step 1' setting
  const stepOneEmailNotificationFieldId = form.stepOneEmailNotificationFieldId
  const respondentInStepOneToNotify = stepOneEmailNotificationFieldId
    ? getEmailFromResponses(stepOneEmailNotificationFieldId, responses)
    : null

  const respondentInStepOneEmailToNotify = respondentInStepOneToNotify
    ? [respondentInStepOneToNotify]
    : []

  // Emails to notify under the 'Other respondents in your workflow' setting
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

  const otherRespondentsInYourWorkflowEmailsToNotifyResult = Result.combine(
    validWorkflowStepsToNotify.flatMap((workflowStep) => {
      return retrieveWorkflowStepEmailAddresses(form, workflowStep, responses)
    }),
  ).map((emails) => emails.flat())

  if (otherRespondentsInYourWorkflowEmailsToNotifyResult.isErr()) {
    logger.error({
      message:
        'Failed to retrieve workflow step email addresses from non-step 1 workflow steps',
      meta: logMeta,
      error: otherRespondentsInYourWorkflowEmailsToNotifyResult.error,
    })
    return err(otherRespondentsInYourWorkflowEmailsToNotifyResult.error)
  }

  const otherRespondentsInYourWorkflowEmailsToNotify =
    otherRespondentsInYourWorkflowEmailsToNotifyResult.value
  return ok([
    ...othersEmailsToNotify,
    ...respondentInStepOneEmailToNotify,
    ...otherRespondentsInYourWorkflowEmailsToNotify,
  ])
}

const checkIsWorkflowCompleted = ({
  currentStepNumber,
  form,
  isRejected,
}: {
  currentStepNumber: number
  form: Pick<IPopulatedMultirespondentForm, 'workflow'>
  isRejected: boolean
}) => {
  const lastStepNumber = form.workflow.length - 1
  const isLastStepSubmitted = currentStepNumber === lastStepNumber

  return isRejected || isLastStepSubmitted
}

const sendMrfOutcomeEmails = ({
  currentStepNumber,
  form,
  responses,
  submissionId,
  isApproval = false,
  isRejected = false,
  attachments,
  pdfResult,
}: {
  currentStepNumber: number
  form: Pick<
    IPopulatedMultirespondentForm,
    | '_id'
    | 'title'
    | 'emails'
    | 'stepOneEmailNotificationFieldId'
    | 'stepsToNotify'
    | 'workflow'
  > & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
  responses: FieldResponsesV3
  submissionId: string
  isApproval?: boolean
  isRejected?: boolean
  attachments?: IAttachmentInfo[]
  pdfResult: ResultAsync<
    Mail.Attachment | undefined,
    AutoreplyPdfGenerationError
  >
}): ResultAsync<
  true,
  InvalidWorkflowTypeError | MailSendError | AutoreplyPdfGenerationError
> => {
  const logMeta = {
    action: 'sendMrfOutcomeEmails',
    formId: form._id?.toString(),
    submissionId,
  }

  return (
    // Step 1: Fetch email address from all workflow steps that are selected to notify
    getEmailsToNotifyAboutMrfOutcome({
      form,
      responses,
      currentStepNumber,
      submissionId,
    })
      .asyncAndThen((destinationEmails) => {
        return pdfResult.map((responsePdf) => {
          return {
            destinationEmails,
            responsePdf,
          }
        })
      })
      // Step 3: Send outcome emails based on type
      .andThen(({ destinationEmails, responsePdf }) => {
        if (!destinationEmails || destinationEmails.length <= 0) {
          logger.info({
            message: 'No destination email found for MRF outcome email',
            meta: logMeta,
          })
          return okAsync(true as const)
        }

        const isWorkflowCompleted = checkIsWorkflowCompleted({
          currentStepNumber,
          form,
          isRejected,
        })

        if (!isWorkflowCompleted) {
          return okAsync(true as const)
        }

        const formQuestionAnswers = getQuestionAnswerPairsForMultipleFields({
          formFields: form.form_fields,
          responses,
        })

        const emailAttachments = []
        emailAttachments.push(...(attachments ?? []))
        if (responsePdf) {
          emailAttachments.push(responsePdf)
        }

        if (isApproval) {
          return MailService.sendMrfApprovalEmail({
            emails: destinationEmails,
            formId: form._id,
            formTitle: form.title,
            responseId: submissionId,
            isRejected,
            formQuestionAnswers,
            attachments: emailAttachments,
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
          attachments: emailAttachments,
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

const sendMrfRespondentCopyEmails = ({
  form,
  responses,
  submission,
  attachments,
  formFields,
  currentStepActiveFields,
  pdfResult,
}: {
  form: Pick<
    IPopulatedMultirespondentForm | SnapshottedFormDef,
    '_id' | 'title' | 'admin'
  > & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
  responses: FieldResponsesV3
  submission: IMultirespondentSubmissionSchema
  attachments?: IAttachmentInfo[]
  formFields: FormFieldSchema[] | FormFieldDto[]
  currentStepActiveFields: string[]
  pdfResult: ResultAsync<
    Mail.Attachment | undefined,
    AutoreplyPdfGenerationError
  >
}): ResultAsync<
  true,
  InvalidWorkflowTypeError | MailSendError | AutoreplyPdfGenerationError
> => {
  const respondentCopyEmailDatas = extractRespondentCopyEmailDatas({
    responses,
    formFields,
    currentStepActiveFields,
  })
  // if no respondent copy email data, continue without sending any emails
  if (!respondentCopyEmailDatas) {
    return okAsync(true)
  }

  const submissionId: string = submission.id

  const formQuestionAnswers = getQuestionAnswerPairsForMultipleFields({
    formFields: form.form_fields,
    responses,
  })

  return pdfResult.andThen((responsePdf) => {
    const recipientAttachments = [
      ...(attachments ?? []),
      ...(responsePdf ? [responsePdf] : []),
    ]
    return ResultAsync.combine(
      respondentCopyEmailDatas.map((autoReplyMailData) => {
        return MailService.sendMrfRespondentCopyEmail({
          formId: form._id,
          formTitle: form.title,
          responseId: submissionId,
          attachments: autoReplyMailData.includeFormSummary
            ? recipientAttachments
            : [],
          autoReplyMailData,
          agencyName: form.admin.agency.fullName,
          ...(autoReplyMailData.includeFormSummary && { formQuestionAnswers }),
        }).orElse((error) => {
          logger.error({
            message: 'Failed to send respondent copy email',
            meta: {
              action: 'sendMrfRespondentCopyEmail',
              formId: form._id,
              submissionId,
              autoReplyMailData,
            },
            error,
          })
          return okAsync(true) //continue even if one email fails
        })
      }),
    ).map(() => true) as ResultAsync<
      true,
      InvalidWorkflowTypeError | MailSendError | AutoreplyPdfGenerationError
    >
  })
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
        verifiedContent,
        responseMetadata,
        version,
        mrfVersion,
      } = encryptedPayload

      const nextStepNumber = 1 // since current step is 0
      const nextStep =
        form.workflow.length >= 1 ? form.workflow[nextStepNumber] : null

      const nextStepRecipientEmailsResult = nextStep
        ? retrieveWorkflowStepEmailAddresses(
            form,
            nextStep,
            encryptedPayload.responses,
          )
        : undefined

      if (
        nextStepRecipientEmailsResult &&
        nextStepRecipientEmailsResult.isErr()
      ) {
        logger.error({
          message: 'Error occurred when retrieiving next step recipient emails',
          meta: logMeta,
          error: nextStepRecipientEmailsResult.error,
        })
      }

      const nextStepRecipientEmails =
        nextStep && nextStepRecipientEmailsResult
          ? nextStepRecipientEmailsResult.unwrapOr(undefined)
          : undefined

      const submittedStepMeta: SubmittedNonApprovalStep = {
        isApproval: false, // first step cannot be approval step
        submittedAt: new Date().toISOString(),
        nextStepRecipientEmails,
      }

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
        verifiedContent,
        attachmentMetadata,
        version,
        workflowStep: 0,
        mrfVersion,
        submittedSteps: [submittedStepMeta],
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

interface CheckIfRespondentFormSummaryIsRequiredArgs {
  responses: FieldResponsesV3
  formFields: FormFieldSchema[] | FormFieldDto[]
  currentStepActiveFields: string[]
}

const checkIfRespondentFormSummaryIsRequired = ({
  responses,
  formFields,
  currentStepActiveFields,
}: CheckIfRespondentFormSummaryIsRequiredArgs): boolean => {
  const respondentCopyEmailDatas = extractRespondentCopyEmailDatas({
    responses,
    formFields,
    currentStepActiveFields,
  })
  return (
    respondentCopyEmailDatas &&
    respondentCopyEmailDatas.some((emailData) => emailData.includeFormSummary)
  )
}

interface CheckIsWorkflowCompletionEmailPdfRequiredArgs {
  currentStepNumber: number
  form: Pick<
    IPopulatedMultirespondentForm,
    | '_id'
    | 'workflow'
    | 'emails'
    | 'stepsToNotify'
    | 'stepOneEmailNotificationFieldId'
  > & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
  responses: FieldResponsesV3
  isRejected: boolean
  submissionId: string
}

const checkIsWorkflowCompletionEmailPdfRequired = ({
  currentStepNumber,
  form,
  responses,
  isRejected,
  submissionId,
}: CheckIsWorkflowCompletionEmailPdfRequiredArgs) => {
  const isWorkflowCompleted = checkIsWorkflowCompleted({
    currentStepNumber,
    form,
    isRejected,
  })

  const hasEmailsToSendMrfOutcomeNotification =
    getEmailsToNotifyAboutMrfOutcome({
      form,
      responses,
      currentStepNumber,
      submissionId,
    })

  return (
    isWorkflowCompleted &&
    hasEmailsToSendMrfOutcomeNotification.isOk() &&
    hasEmailsToSendMrfOutcomeNotification.value.length > 0
  )
}

type CheckIsPdfGenerationRequiredArgs = Omit<
  CheckIfRespondentFormSummaryIsRequiredArgs,
  'formFields'
> &
  CheckIsWorkflowCompletionEmailPdfRequiredArgs

const checkIsPdfGenerationRequired = ({
  responses,
  form,
  currentStepActiveFields,
  currentStepNumber,
  isRejected,
  submissionId,
}: CheckIsPdfGenerationRequiredArgs): boolean => {
  return (
    checkIfRespondentFormSummaryIsRequired({
      responses,
      formFields: form.form_fields,
      currentStepActiveFields,
    }) ||
    checkIsWorkflowCompletionEmailPdfRequired({
      currentStepNumber,
      form,
      responses,
      isRejected,
      submissionId,
    })
  )
}

const generatePdfAttachmentIfRequired = ({
  submission,
  form,
  responses,
  currentStepActiveFields,
  currentStepNumber,
  isRejected,
}: CheckIsPdfGenerationRequiredArgs & {
  submission: IMultirespondentSubmissionSchema
  form: Pick<
    IPopulatedMultirespondentForm,
    | '_id'
    | 'title'
    | 'workflow'
    | 'emails'
    | 'stepsToNotify'
    | 'stepOneEmailNotificationFieldId'
  > & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
}): ResultAsync<Mail.Attachment | undefined, AutoreplyPdfGenerationError> => {
  const submissionId = submission.id

  if (
    !checkIsPdfGenerationRequired({
      responses,
      form,
      currentStepActiveFields,
      currentStepNumber,
      isRejected,
      submissionId,
    })
  ) {
    return okAsync(undefined)
  }

  const responsesData = getResponsesDataFromMrfResponses({
    formFields: form.form_fields,
    responses,
  })

  const autoReplyData = {
    refNo: submissionId,
    formTitle: form.title,
    submissionDateTime: submission.created ?? new Date(),
    responsesData,
    formUrl: `${config.app.appUrl}/${form._id}`,
  }

  const DEFAULT_RESPONSE_PDF_FILENAME = 'response.pdf'
  const pdfResult = generateAutoreplyPdf(autoReplyData, true).map(
    (pdfBuffer) => ({
      filename: DEFAULT_RESPONSE_PDF_FILENAME,
      content: Buffer.copyBytesFrom(pdfBuffer),
    }),
  )

  return pdfResult
}

export const performMultiRespondentPostSubmissionCreateActions = ({
  submission,
  submissionId,
  form,
  encryptedPayload,
  logMeta,
  attachments,
}: {
  submission: IMultirespondentSubmissionSchema
  submissionId: string
  form: IPopulatedMultirespondentForm
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
  attachments?: IAttachmentInfo[]
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

  const pdfResult = generatePdfAttachmentIfRequired({
    submission,
    form,
    responses,
    currentStepActiveFields: form.workflow[currentStepNumber]?.edit ?? [],
    currentStepNumber,
    isRejected: false, // first step cannot be an approval step and thus cannot be rejected.
    submissionId,
  })

  sendMrfRespondentCopyEmails({
    form,
    responses,
    submission,
    attachments,
    formFields: form.form_fields,
    currentStepActiveFields: form.workflow[currentStepNumber]?.edit ?? [],
    pdfResult,
  }).mapErr((error) => {
    logger.error({
      message: 'Send multirespondent respondent copy email error',
      meta: logMeta,
      error,
    })
  })

  const webhookUrl = form.webhook?.url
  if (webhookUrl) {
    logger.info({
      message: 'Sending initial webhook for multirespondent submission',
      meta: logMeta,
    })

    WebhookFactory.sendInitialWebhook(
      submission,
      webhookUrl,
      !!form.webhook?.isRetryEnabled,
    )
      .andThen(() => okAsync(form))
      .mapErr((error) => {
        logger.error({
          message: 'Multirespondent submission webhook error',
          meta: logMeta,
          error,
        })
      })
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
        attachments,
        pdfResult,
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
  snapshottedFormDef,
  encryptedPayload,
  logMeta,
}: {
  submissionId: string
  snapshottedFormDef: SnapshottedFormDef
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
    formId: snapshottedFormDef._id,
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
        verifiedContent,
        version,
        workflowStep,
        mrfVersion,
      } = encryptedPayload

      const nextStepNumber = workflowStep + 1
      const nextStep =
        snapshottedFormDef.workflow.length > nextStepNumber
          ? snapshottedFormDef.workflow[nextStepNumber]
          : null
      const nextStepRecipientEmailsResult = nextStep
        ? retrieveWorkflowStepEmailAddresses(
            snapshottedFormDef,
            nextStep,
            encryptedPayload.responses,
          )
        : undefined

      if (
        nextStepRecipientEmailsResult &&
        nextStepRecipientEmailsResult.isErr()
      ) {
        logger.error({
          message: 'Error occurred when retrieiving next step recipient emails',
          meta: logMeta,
          error: nextStepRecipientEmailsResult.error,
        })
      }
      const nextStepRecipientEmails = nextStepRecipientEmailsResult
        ? nextStepRecipientEmailsResult.unwrapOr(undefined)
        : undefined

      const isApprovalForm = checkIsFormApproval(snapshottedFormDef)
      const isStepRejectedResult = checkIsStepRejected({
        zeroIndexedStepNumber: workflowStep,
        form: snapshottedFormDef,
        responses: encryptedPayload.responses,
      })
      if (isStepRejectedResult.isErr()) {
        logger.error({
          message: 'Error occurred when checking if step is rejected',
          meta: logMeta,
          error: isStepRejectedResult.error,
        })
        return errAsync(isStepRejectedResult.error)
      }

      const isStepRejected = isStepRejectedResult.value

      const submittedStepMetaCommons = {
        stepNumber: workflowStep,
        submittedAt: new Date().toISOString(),
        nextStepRecipientEmails,
      }
      const submittedStepMeta = isApprovalForm
        ? ({
            ...submittedStepMetaCommons,
            status: isStepRejected
              ? WorkflowStatus.REJECTED
              : WorkflowStatus.APPROVED,
            isApproval: true,
          } as SubmittedApprovalStep)
        : ({
            ...submittedStepMetaCommons,
            isApproval: false,
          } as SubmittedNonApprovalStep)

      submission.submittedSteps = [
        ...(submission.submittedSteps ?? []),
        submittedStepMeta,
      ]
      submission.responseMetadata = responseMetadata
      submission.submissionPublicKey = submissionPublicKey
      submission.encryptedSubmissionSecretKey = encryptedSubmissionSecretKey
      submission.encryptedContent = encryptedContent
      submission.verifiedContent = verifiedContent
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
  submission,
  submissionId,
  snapshottedFormDef,
  currentStepNumber,
  encryptedPayload,
  logMeta,
  attachments,
}: {
  submission: IMultirespondentSubmissionSchema
  submissionId: string
  snapshottedFormDef: SnapshottedFormDef
  currentStepNumber: number
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
  attachments?: IAttachmentInfo[]
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
    formId: snapshottedFormDef._id,
    submissionId,
  }

  const isStepRejectedResult = checkIsStepRejected({
    zeroIndexedStepNumber: currentStepNumber,
    form: snapshottedFormDef,
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

  const webhookUrl = snapshottedFormDef.webhook?.url
  if (webhookUrl) {
    logger.info({
      message: 'Sending update webhook for multirespondent submission',
      meta: logMeta,
    })

    WebhookFactory.sendInitialWebhook(
      submission,
      webhookUrl,
      !!snapshottedFormDef.webhook?.isRetryEnabled,
    )
      .andThen(() => okAsync(undefined))
      .mapErr((error) => {
        logger.error({
          message: 'Multirespondent submission webhook error',
          meta: logMeta,
          error,
        })
      })
  }

  const pdfResult = generatePdfAttachmentIfRequired({
    submission,
    form: snapshottedFormDef,
    responses,
    currentStepNumber,
    isRejected: isStepRejected,
    submissionId,
    currentStepActiveFields:
      snapshottedFormDef.workflow[currentStepNumber]?.edit ?? [],
  })

  sendMrfRespondentCopyEmails({
    form: snapshottedFormDef,
    responses,
    submission,
    attachments,
    formFields: snapshottedFormDef.form_fields,
    currentStepActiveFields:
      snapshottedFormDef.workflow[currentStepNumber]?.edit ?? [],
    pdfResult: checkIfRespondentFormSummaryIsRequired({
      responses,
      formFields: snapshottedFormDef.form_fields,
      currentStepActiveFields:
        snapshottedFormDef.workflow[currentStepNumber]?.edit ?? [],
    })
      ? pdfResult
      : okAsync(undefined),
  }).mapErr((error) => {
    logger.error({
      message: 'Send multirespondent respondent copy email error',
      meta: logMeta,
      error,
    })
  })

  if (isStepRejected) {
    return sendMrfOutcomeEmails({
      currentStepNumber,
      form: snapshottedFormDef,
      responses,
      submissionId,
      isApproval: true,
      isRejected: true,
      attachments: attachments,
      pdfResult: pdfResult,
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
    form: snapshottedFormDef,
    responses,
    submissionId,
    isApproval: checkIsFormApproval(snapshottedFormDef),
    attachments: attachments,
    pdfResult: checkIsWorkflowCompletionEmailPdfRequired({
      currentStepNumber,
      form: snapshottedFormDef,
      responses,
      isRejected: isStepRejected,
      submissionId,
    })
      ? pdfResult
      : okAsync(undefined),
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
        form: snapshottedFormDef,
        formTitle: snapshottedFormDef.title,
        responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
          snapshottedFormDef._id,
          submissionId,
          { key: submissionSecretKey },
        )}`,
        formId: snapshottedFormDef._id,
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
