import { GrowthBook } from '@growthbook/growthbook'
import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import {
  BasicField,
  FormAuthType,
  FormFieldDto,
  FormResponseMode,
  FormWorkflowStepDto,
  SubmittedApprovalStep,
  SubmittedNonApprovalStep,
  SubmittedStep,
  WorkflowStatus,
} from 'formsg-shared/types'
import { getRunnableWorkflow } from 'formsg-shared/utils/runnable-workflow'
import { getMultirespondentSubmissionEditPath } from 'formsg-shared/utils/urls'
import moment from 'moment'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import Mail from 'nodemailer/lib/mailer'

import {
  Environment,
  FormFieldSchema,
  IAttachmentInfo,
  IMultirespondentSubmissionSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
  WebhookView,
} from '../../../../types'
import {
  MultirespondentSubmissionDto,
  SnapshottedFormDef,
} from '../../../../types/api'
import config, { isTest } from '../../../config/config'
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
import { DatabaseError, PossibleDatabaseError } from '../../core/core.errors'
import { FormRespondentSingleSubmissionValidationError } from '../../form/form.errors'
import { isFormMultirespondent } from '../../form/form.utils'
import { WebhookFactory } from '../../webhook/webhook.factory'
import { getWebhookType } from '../../webhook/webhook.service'
import {
  AttachmentUploadError,
  ExpectedResponseNotFoundError,
  InvalidApprovalFieldTypeError,
  InvalidWorkflowTypeError,
  MissingSubmitterIdError,
  MrfReminderInvalidWorkflowStepError,
  MrfReminderRecipientEmailsEmptyError,
  ResponseModeError,
  SubmissionNotFoundError,
  SubmissionSaveError,
} from '../submission.errors'
import { uploadAttachments } from '../submission.service'
import { AttachmentMetadata } from '../submission.types'
import {
  getMrfSubmissionWorkflowStatus,
  isAdminEmailPdfEnabled,
} from '../submission.utils'
import { reportSubmissionResponseTime } from '../submissions.statsd-client'

import { SnapshotWriteError } from './webhook/submission-snapshot.errors'
import { buildV4Snapshot } from './webhook/submission-snapshot.producer'
import { SubmissionSnapshotV4 } from './webhook/submission-snapshot.schema'
import { writeV4Snapshot } from './webhook/submission-snapshot.store'
import {
  getWebhookPayloadPolicy,
  mrfVersionToContentFormat,
} from './webhook/webhook-payload-policy'
import { reconstructMrfWebhookData } from './webhook/webhook-reconstruction'
import {
  shouldSendMrfWebhook,
  shouldWriteV4Snapshot,
} from './webhook/webhook-send-eligibility'
import { MultirespondentSubmissionContent } from './multirespondent-submission.types'
import {
  buildMrfResponseJson,
  extractEmailAnswersFromResponses,
  extractRespondentCopyEmailDatas,
  formatSubmittedStepTimestamp,
  getEmailFromResponses,
  getFormDelimiter,
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

export type SavedMultirespondentSubmission = {
  submission: IMultirespondentSubmissionSchema & {
    _id: mongoose.Types.ObjectId
  }
  snapshot?: SubmissionSnapshotV4
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

const checkIsStepApproval = (
  form: Pick<IPopulatedMultirespondentForm, 'workflow'>,
  zeroIndexedStepNumber: number,
): boolean => {
  return form.workflow && !!form.workflow[zeroIndexedStepNumber]?.approval_field
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
  responses: FieldResponsesV4
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

  return ok((approvalFieldResponse.answer as { value: string }).value === 'No')
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
  responses: FieldResponsesV4
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

  const nextStep = getRunnableWorkflow(form.workflow)[nextStepNumber]
  if (!nextStep) {
    return okAsync(true)
  }

  const formQuestionAnswers = getQuestionAnswerPairsForMultipleFields({
    formFields: form.form_fields,
    responses,
  })

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
          formId,
          responseId: submissionId,
          responseUrl,
          formQuestionAnswers,
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
    formId,
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
  responses: FieldResponsesV4
  currentStepNumber: number
  submissionId: string
}): Result<string[], InvalidWorkflowTypeError> => {
  const logMeta = {
    action: 'getMrfOutcomeEmailsToNotify',
    formId: form._id?.toString(),
    submissionId,
  }

  // Emails to notify under the 'Any email address you choose' setting
  const othersEmailsToNotify =
    form.emails && Array.isArray(form.emails) ? form.emails : []

  // Emails to notify under the 'An email address collected from an email field' setting
  const stepOneEmailNotificationFieldId = form.stepOneEmailNotificationFieldId
  const respondentInStepOneToNotify = stepOneEmailNotificationFieldId
    ? getEmailFromResponses(stepOneEmailNotificationFieldId, responses)
    : null

  const respondentInStepOneEmailToNotify = respondentInStepOneToNotify
    ? [respondentInStepOneToNotify]
    : []

  // Emails to notify under the 'People who are filling up a workflow step' setting
  const stepsToNotifyUpToCurrentStep = getRunnableWorkflow(form.workflow).slice(
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
  const workflow = getRunnableWorkflow(form.workflow)
  const lastStepNumber = workflow.length - 1
  const isLastStepSubmitted = currentStepNumber === lastStepNumber

  return !workflow.length || isRejected || isLastStepSubmitted
}

const sendMrfOutcomeEmails = ({
  currentStepNumber,
  form,
  responses,
  latestSubmissionTimestamp,
  submissionId,
  isApproval = false,
  isRejected = false,
  attachments,
  pdfResult,
  growthbook,
}: {
  currentStepNumber: number
  form: Pick<
    IPopulatedMultirespondentForm,
    | '_id'
    | 'title'
    | 'emails'
    | 'metadata'
    | 'stepOneEmailNotificationFieldId'
    | 'stepsToNotify'
    | 'workflow'
  > & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
  responses: FieldResponsesV4
  latestSubmissionTimestamp: string
  submissionId: string
  isApproval?: boolean
  isRejected?: boolean
  attachments?: IAttachmentInfo[]
  pdfResult: ResultAsync<
    Mail.Attachment | undefined,
    AutoreplyPdfGenerationError
  >
  growthbook?: GrowthBook
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
        return pdfResult
          .orElse(() => okAsync(undefined))
          .map((responsePdf) => {
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

        // TODO (formid-json): remove when Form ID in response JSON is GA
        const includeFormIdInResponseJson: boolean =
          growthbook?.getFeatureValue(featureFlags.formIdJson, false) ?? false

        const responseJson = buildMrfResponseJson({
          formFields: form.form_fields,
          responses,
          formId: includeFormIdInResponseJson ? String(form._id) : undefined,
          responseId: submissionId,
          timestamp: latestSubmissionTimestamp,
          delimiter: getFormDelimiter(form.metadata),
        })

        const emailAttachments = []
        emailAttachments.push(...(attachments ?? []))
        if (responsePdf) {
          emailAttachments.push(responsePdf)
        }

        if (isApproval) {
          return MailService.sendMrfApprovalEmail({
            emails: destinationEmails,
            formId: String(form._id),
            formTitle: form.title,
            responseId: submissionId,
            submissionId,
            timestamp: latestSubmissionTimestamp,
            isRejected,
            formQuestionAnswers,
            responseJson,
            attachments: emailAttachments,
            replyTo:
              extractEmailAnswersFromResponses(responses).join(', ') ||
              undefined,
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
          formId: String(form._id),
          formTitle: form.title,
          responseId: submissionId,
          submissionId,
          timestamp: latestSubmissionTimestamp,
          formQuestionAnswers,
          responseJson,
          attachments: emailAttachments,
          replyTo:
            extractEmailAnswersFromResponses(responses).join(', ') || undefined,
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
    '_id' | 'title' | 'admin' | 'hasStatusTracker'
  > & {
    form_fields: FormFieldSchema[] | FormFieldDto[]
  }
  responses: FieldResponsesV4
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

  const latestSubmissionTimestamp = submission.submittedSteps
    ? moment(
        submission.submittedSteps[submission.submittedSteps.length - 1]
          .submittedAt,
      )
        .tz('Asia/Singapore')
        .format('ddd, DD MMM YYYY hh:mm:ss A')
    : ''

  const formQuestionAnswers = getQuestionAnswerPairsForMultipleFields({
    formFields: form.form_fields,
    responses,
  })

  return pdfResult
    .orElse(() => okAsync(undefined))
    .andThen((responsePdf) => {
      const recipientAttachments = [
        ...(attachments ?? []),
        ...(responsePdf ? [responsePdf] : []),
      ]
      return ResultAsync.combine(
        respondentCopyEmailDatas.map((autoReplyMailData) => {
          return MailService.sendRespondentCopyEmail({
            formId: form._id,
            formTitle: form.title,
            responseId: submissionId,
            timestamp: latestSubmissionTimestamp,
            attachments: autoReplyMailData.includeFormSummary
              ? recipientAttachments
              : [],
            autoReplyMailData,
            agencyName: form.admin.agency.fullName,
            hasStatusTracker: form.hasStatusTracker,
            ...(autoReplyMailData.includeFormSummary && {
              formQuestionAnswers,
            }),
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
  growthbook,
}: {
  form: IPopulatedMultirespondentForm
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
  growthbook?: GrowthBook
}): ResultAsync<
  SavedMultirespondentSubmission,
  AttachmentUploadError | SubmissionSaveError | SnapshotWriteError
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
        hashedSubmitterId,
        stepTokenHash,
        encryptedStepToken,
      } = encryptedPayload

      const nextStepNumber = 1 // since current step is 0
      const runnableWorkflow = getRunnableWorkflow(form.workflow)
      const nextStep =
        runnableWorkflow.length >= 1 ? runnableWorkflow[nextStepNumber] : null

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
        submitterId: hashedSubmitterId,
      }

      // RATIONALE: Generate the submissionId up front so the S3 snapshot key can be built
      // BEFORE the row is persisted (Snapshot saves to S3 first ordering).
      const submissionObjectId = new mongoose.Types.ObjectId()

      const submissionContent: MultirespondentSubmissionContent & {
        _id: mongoose.Types.ObjectId
      } = {
        _id: submissionObjectId,
        form: form._id,
        authType: form.authType,
        myInfoFields: form.getUniqueMyInfoAttrs(),
        form_fields: form.form_fields,
        form_logics: form.form_logics,
        // Snapshot what will actually run, so a submission started while step 1
        // is unset stays an ordinary form for its whole life even if step 1 is
        // set up again midway.
        workflow: runnableWorkflow,
        submissionPublicKey,
        encryptedSubmissionSecretKey,
        encryptedContent,
        verifiedContent,
        attachmentMetadata,
        version,
        workflowStep: 0,
        mrfVersion,
        submittedSteps: [submittedStepMeta],
        stepTokenHash,
        encryptedStepToken,
      }

      const shouldWriteSnapshot = shouldWriteV4Snapshot({
        mrfVersion,
        webhook: form.webhook,
        isMrfWebhooksEnabled:
          growthbook?.isOn(featureFlags.enableMrfWebhooks) ?? false,
        isStepWriteTokenEnabled:
          growthbook?.isOn(featureFlags.mrfStepWriteToken) ?? false,
      })

      const saveSubmission = async () => {
        if (form.isSingleSubmission && form.authType !== FormAuthType.NIL) {
          if (!hashedSubmitterId) {
            const missingSubmitterIdError = new MissingSubmitterIdError()
            logger.error({
              message:
                'Failed to find submitterId which is mandatory for isSingleSubmission enabled forms',
              meta: logMeta,
              error: missingSubmitterIdError,
            })
            return Promise.reject(missingSubmitterIdError)
          }
          const uniqueSavedSubmission =
            await MultirespondentSubmission.saveIfSubmitterIdIsUnique(
              form._id,
              hashedSubmitterId,
              0,
              submissionContent,
            )
          if (!uniqueSavedSubmission) {
            const formSingleSubmissionError =
              new FormRespondentSingleSubmissionValidationError()
            logger.error({
              message: formSingleSubmissionError.message,
              meta: logMeta,
              error: formSingleSubmissionError,
            })
            return Promise.reject(formSingleSubmissionError)
          }
          return uniqueSavedSubmission
        }
        const submission = new MultirespondentSubmission(submissionContent)
        return submission.save()
      }

      const snapshot = shouldWriteSnapshot
        ? buildV4Snapshot({
            formId: String(form._id),
            submissionId: String(submissionObjectId),
            submissionIndex: 0,
            workflowStep: 0,
            encryptedContent,
            encryptedSubmissionSecretKey,
            verifiedContent,
            attachmentMetadata: Object.fromEntries(
              attachmentMetadata ?? new Map(),
            ),
            createdAt: submittedStepMeta.submittedAt,
          })
        : undefined

      const writeSnapshotIfNeeded: ResultAsync<undefined, SnapshotWriteError> =
        snapshot
          ? writeV4Snapshot(snapshot).map(({ token }) => {
              submittedStepMeta.snapshotTokens = { v4: token }
              return undefined
            })
          : okAsync(undefined)

      return writeSnapshotIfNeeded.andThen(() =>
        ResultAsync.fromPromise(
          saveSubmission().then((submission) => ({
            submission,
            responseMetadata,
            snapshot,
          })),
          (error) => {
            if (
              error instanceof FormRespondentSingleSubmissionValidationError
            ) {
              return error
            }
            logger.error({
              message: 'Multirespondent submission save error',
              meta: logMeta,
              error,
            })
            return new SubmissionSaveError()
          },
        ),
      )
    })
    .map(({ submission, responseMetadata, snapshot }) => {
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

      return { submission, snapshot }
    })
}

interface CheckIfRespondentFormSummaryIsRequiredArgs {
  responses: FieldResponsesV4
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
  responses: FieldResponsesV4
  isRejected: boolean
  submissionId: string
  growthbook?: GrowthBook
}

const checkIsWorkflowCompletionEmailPdfRequired = ({
  currentStepNumber,
  form,
  responses,
  isRejected,
  submissionId,
  growthbook,
}: CheckIsWorkflowCompletionEmailPdfRequiredArgs) => {
  const isGbFlagEnabled =
    isAdminEmailPdfEnabled({
      growthbook,
      formFields: form.form_fields as FormFieldSchema[],
    }) || isTest

  if (!isGbFlagEnabled) {
    return false
  }
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

const generatePdfAttachmentIfRequired = ({
  submission,
  form,
  responses,
  currentStepActiveFields,
  currentStepNumber,
  isRejected,
  growthbook,
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

  const isRespondentCopyPdfRequired = checkIfRespondentFormSummaryIsRequired({
    responses,
    formFields: form.form_fields,
    currentStepActiveFields,
  })
  const isWorkflowCompletionEmailPdfRequired =
    checkIsWorkflowCompletionEmailPdfRequired({
      currentStepNumber,
      form,
      responses,
      isRejected,
      submissionId,
      growthbook,
    })

  if (!isRespondentCopyPdfRequired && !isWorkflowCompletionEmailPdfRequired) {
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

  const pdfResult = generateAutoreplyPdf(autoReplyData)
    .map((pdfBuffer) => ({
      filename: `RefNo ${submissionId}.pdf`,
      content: Buffer.copyBytesFrom(pdfBuffer),
    }))
    .mapErr((error) => {
      logger.error({
        message:
          'Failed to include required PDF attachment for email notifications',
        meta: {
          action: 'generatePdfAttachmentIfRequired',
          submissionId,
          formId: form._id,
          formResponseMode: FormResponseMode.Multirespondent,
          isRespondentCopyPdfRequired,
          isWorkflowCompletionEmailPdfRequired,
        },
        error,
      })
      return error
    })

  return pdfResult
}

const sendMrfInitialWebhookIfEligible = ({
  submission,
  snapshot,
  webhookUrl,
  isRetryEnabled,
  growthbook,
  logMeta,
}: {
  submission: IMultirespondentSubmissionSchema
  snapshot?: SubmissionSnapshotV4
  webhookUrl: string
  isRetryEnabled: boolean
  growthbook?: GrowthBook
  logMeta: CustomLoggerParams['meta']
}): void => {
  const webhookType = getWebhookType(webhookUrl)
  const isStepWriteTokenEnabled =
    growthbook?.isOn(featureFlags.mrfStepWriteToken) ?? false

  const shouldSend = shouldSendMrfWebhook({
    webhookType,
    isMrfWebhooksEnabled:
      growthbook?.isOn(featureFlags.enableMrfWebhooks) ?? false,
    isStepWriteTokenEnabled,
  })
  if (!shouldSend) {
    return
  }

  logger.info({
    message: 'Sending initial webhook for multirespondent submission',
    meta: { ...logMeta, webhookType },
  })

  const submissionIndex = (submission.submittedSteps?.length ?? 1) - 1

  // For V3 legacy, we load from the live row without a reconstructing from snapshot.
  if (mrfVersionToContentFormat(submission.mrfVersion) === 'v3') {
    WebhookFactory.sendInitialWebhook(
      submission,
      webhookUrl,
      isRetryEnabled,
    ).mapErr((error) => {
      logger.error({
        message: 'Multirespondent submission webhook error',
        meta: logMeta,
        error,
      })
    })
    return
  }

  ResultAsync.fromPromise(
    submission.getWebhookView(),
    () => new DatabaseError(),
  )
    .andThen((liveView) => {
      const policy = getWebhookPayloadPolicy({
        webhookType: webhookType === 'plumber' ? 'plumber' : 'generic',
        isStepWriteTokenEnabled,
        submissionIndex,
        submittedStepsLength: submission.submittedSteps?.length ?? 0,
      })
      const snapshotDetails = snapshot
        ? {
            snapshot,
            submissionIndex,
          }
        : {
            snapshot: undefined,
            submissionIndex: undefined,
          }
      return reconstructMrfWebhookData({
        liveData: liveView.data,
        policy,
        ...snapshotDetails,
      }).asyncAndThen((data) => {
        const webhookView: WebhookView = { data }

        const snapshotRef = snapshot
          ? {
              submissionIndex,
              contentFormat: snapshot.contentFormat,
            }
          : undefined

        return WebhookFactory.sendInitialWebhook(
          submission,
          webhookUrl,
          isRetryEnabled,
          webhookView,
          snapshotRef,
        ).map(() => undefined)
      })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Multirespondent submission webhook error',
        meta: logMeta,
        error,
      })
    })
}

export const performMultiRespondentPostSubmissionCreateActions = ({
  submission,
  snapshot,
  submissionId,
  form,
  encryptedPayload,
  logMeta,
  attachments,
  growthbook,
}: {
  submission: IMultirespondentSubmissionSchema
  snapshot?: SubmissionSnapshotV4
  submissionId: string
  form: IPopulatedMultirespondentForm
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
  attachments?: IAttachmentInfo[]
  growthbook?: GrowthBook
}): ResultAsync<boolean, InvalidWorkflowTypeError | MailSendError> => {
  const { submissionSecretKey, responses, stepToken } = encryptedPayload
  const currentStepNumber = 0

  // if there is no workflow, every field is an active field
  const runnableWorkflow = getRunnableWorkflow(form.workflow)
  const currentStepActiveFields: string[] = runnableWorkflow.length
    ? (runnableWorkflow[currentStepNumber]?.edit ?? [])
    : form.form_fields.map((field) => field._id)

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
    currentStepActiveFields,
    currentStepNumber,
    isRejected: false, // first step cannot be an approval step and thus cannot be rejected.
    submissionId,
    growthbook,
  })

  const latestSubmissionTimestamp = formatSubmittedStepTimestamp({
    submittedSteps: submission.submittedSteps,
    stepIndex: currentStepNumber,
  })

  const sendMrfRespondentCopyEmailsPdfResult =
    checkIfRespondentFormSummaryIsRequired({
      responses,
      formFields: form.form_fields,
      currentStepActiveFields,
    })
      ? pdfResult
      : okAsync(undefined)

  const sendMrfOutcomeEmailsPdfResult =
    checkIsWorkflowCompletionEmailPdfRequired({
      currentStepNumber,
      form,
      responses,
      isRejected: false,
      submissionId,
      growthbook,
    })
      ? pdfResult
      : okAsync(undefined)

  sendMrfRespondentCopyEmails({
    form,
    responses,
    submission,
    attachments,
    formFields: form.form_fields,
    currentStepActiveFields,
    pdfResult: sendMrfRespondentCopyEmailsPdfResult,
  }).mapErr((error) => {
    logger.error({
      message: 'Send multirespondent respondent copy email error',
      meta: logMeta,
      error,
    })
  })

  const webhookUrl = form.webhook?.url
  if (webhookUrl) {
    sendMrfInitialWebhookIfEligible({
      submission,
      snapshot,
      webhookUrl,
      isRetryEnabled: !!form.webhook?.isRetryEnabled,
      growthbook,
      logMeta,
    })
  }

  return sendNextStepEmail({
    nextStepNumber: currentStepNumber + 1, // we want to send emails to the addresses linked to the next step of the workflow
    form,
    formTitle: form.title,
    responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
      form._id,
      submissionId,
      { key: submissionSecretKey, stepToken },
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
        latestSubmissionTimestamp,
        submissionId,
        attachments,
        pdfResult: sendMrfOutcomeEmailsPdfResult,
        growthbook,
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
  growthbook,
}: {
  submissionId: string
  snapshottedFormDef: SnapshottedFormDef
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
  growthbook?: GrowthBook
}): ResultAsync<
  SavedMultirespondentSubmission,
  | AttachmentUploadError
  | SubmissionSaveError
  | SubmissionNotFoundError
  | PossibleDatabaseError
  | SnapshotWriteError
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
        stepTokenHash,
        encryptedStepToken,
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
      const submittedStepMeta = checkIsStepApproval(
        snapshottedFormDef,
        workflowStep,
      )
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

      const submissionIndex = submission.submittedSteps?.length ?? 0

      submission.responseMetadata = responseMetadata
      submission.submissionPublicKey = submissionPublicKey
      submission.encryptedSubmissionSecretKey = encryptedSubmissionSecretKey
      submission.encryptedContent = encryptedContent
      submission.verifiedContent = verifiedContent
      submission.version = version
      submission.workflowStep = workflowStep
      submission.attachmentMetadata = attachmentMetadata
      submission.mrfVersion = mrfVersion
      submission.stepTokenHash = stepTokenHash
      submission.encryptedStepToken = encryptedStepToken

      const shouldWriteSnapshot = shouldWriteV4Snapshot({
        mrfVersion,
        webhook: snapshottedFormDef.webhook,
        isMrfWebhooksEnabled:
          growthbook?.isOn(featureFlags.enableMrfWebhooks) ?? false,
        isStepWriteTokenEnabled:
          growthbook?.isOn(featureFlags.mrfStepWriteToken) ?? false,
      })

      const snapshot = shouldWriteSnapshot
        ? buildV4Snapshot({
            formId: String(snapshottedFormDef._id),
            submissionId: String(submission._id),
            submissionIndex,
            workflowStep,
            encryptedContent,
            encryptedSubmissionSecretKey,
            verifiedContent,
            attachmentMetadata: Object.fromEntries(
              attachmentMetadata ?? new Map(),
            ),
            createdAt: submittedStepMeta.submittedAt,
          })
        : undefined

      const writeSnapshotIfNeeded: ResultAsync<undefined, SnapshotWriteError> =
        snapshot
          ? writeV4Snapshot(snapshot).map(({ token }) => {
              submittedStepMeta.snapshotTokens = { v4: token }
              return undefined
            })
          : okAsync(undefined)

      return writeSnapshotIfNeeded.andThen(() => {
        // NOTE: Append AFTER the token is recorded so the value survives mongoose's
        // subdocument cast (which copies the plain object into the array).
        submission.submittedSteps = [
          ...(submission.submittedSteps ?? []),
          submittedStepMeta,
        ]

        return ResultAsync.fromPromise(
          submission
            .save()
            .then(() => ({ submission, responseMetadata, snapshot })),
          (error) => {
            if (error instanceof mongoose.Error.VersionError) {
              return transformMongoError(error)
            }
            logger.error({
              message: 'Multirespondent submission save error',
              meta: logMeta,
              error,
            })
            return new SubmissionSaveError()
          },
        )
      })
    })
    .map(({ submission, responseMetadata, snapshot }) => {
      logger.info({
        message: 'Saved submission to MongoDB',
        meta: { ...logMeta, submissionId: submission.id, responseMetadata },
      })

      return { submission, snapshot }
    })
}

export const performMultiRespondentPostSubmissionUpdateActions = ({
  submission,
  snapshot,
  submissionId,
  snapshottedFormDef,
  currentStepNumber,
  encryptedPayload,
  logMeta,
  attachments,
  growthbook,
}: {
  submission: IMultirespondentSubmissionSchema
  snapshot?: SubmissionSnapshotV4
  submissionId: string
  snapshottedFormDef: SnapshottedFormDef
  currentStepNumber: number
  encryptedPayload: MultirespondentSubmissionDto
  logMeta: CustomLoggerParams['meta']
  attachments?: IAttachmentInfo[]
  growthbook?: GrowthBook
}): ResultAsync<
  boolean,
  | InvalidWorkflowTypeError
  | MailSendError
  | ExpectedResponseNotFoundError
  | InvalidApprovalFieldTypeError
> => {
  const { responses, submissionSecretKey, stepToken } = encryptedPayload

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
    sendMrfInitialWebhookIfEligible({
      submission,
      snapshot,
      webhookUrl,
      isRetryEnabled: !!snapshottedFormDef.webhook?.isRetryEnabled,
      growthbook,
      logMeta,
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
    growthbook,
  })

  const latestSubmissionTimestamp = formatSubmittedStepTimestamp({
    submittedSteps: submission.submittedSteps,
    stepIndex: currentStepNumber,
  })

  const sendMrfRespondentCopyEmailsPdfResult =
    checkIfRespondentFormSummaryIsRequired({
      responses,
      formFields: snapshottedFormDef.form_fields,
      currentStepActiveFields:
        snapshottedFormDef.workflow[currentStepNumber]?.edit ?? [],
    })
      ? pdfResult
      : okAsync(undefined)

  const sendMrfOutcomeEmailsPdfResult =
    checkIsWorkflowCompletionEmailPdfRequired({
      currentStepNumber,
      form: snapshottedFormDef,
      responses,
      isRejected: isStepRejected,
      submissionId,
      growthbook,
    })
      ? pdfResult
      : okAsync(undefined)

  sendMrfRespondentCopyEmails({
    form: snapshottedFormDef,
    responses,
    submission,
    attachments,
    formFields: snapshottedFormDef.form_fields,
    currentStepActiveFields:
      snapshottedFormDef.workflow[currentStepNumber]?.edit ?? [],
    pdfResult: sendMrfRespondentCopyEmailsPdfResult,
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
      latestSubmissionTimestamp,
      submissionId,
      isApproval: true,
      isRejected: true,
      attachments: attachments,
      pdfResult: sendMrfOutcomeEmailsPdfResult,
      growthbook,
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
    latestSubmissionTimestamp,
    submissionId,
    isApproval: checkIsFormApproval(snapshottedFormDef),
    attachments: attachments,
    pdfResult: sendMrfOutcomeEmailsPdfResult,
    growthbook,
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
          { key: submissionSecretKey, stepToken },
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
