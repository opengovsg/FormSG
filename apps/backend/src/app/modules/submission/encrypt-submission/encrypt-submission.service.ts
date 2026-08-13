import { GrowthBook } from '@growthbook/growthbook'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import { FormResponseMode, PaymentChannel } from 'formsg-shared/types'
import mongoose from 'mongoose'
import { err, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import Mail from 'nodemailer/lib/mailer'

import {
  EmailDataField,
  FieldResponse,
  FormFieldSchema,
  IEncryptedSubmissionSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
} from '../../../../types'
import config, { isTest } from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { AutoreplyPdfGenerationError } from '../../../services/mail/mail.errors'
import MailService from '../../../services/mail/mail.service'
import { AutoReplyMailData } from '../../../services/mail/mail.types'
import { generateAutoreplyPdf } from '../../../services/mail/mail.utils'
import { PossibleDatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { isFormEncryptMode } from '../../form/form.utils'
import {
  WebhookPushToQueueError,
  WebhookValidationError,
} from '../../webhook/webhook.errors'
import { WebhookFactory } from '../../webhook/webhook.factory'
import { MYINFO_PREFIX } from '../email-submission/email-submission.constants'
import * as EmailSubmissionService from '../email-submission/email-submission.service'
import { SubmissionEmailObj } from '../email-submission/email-submission.util'
import {
  ResponseModeError,
  SendEmailConfirmationError,
  SubmissionNotFoundError,
  UnsupportedSettingsError,
} from '../submission.errors'
import { sendEmailConfirmations } from '../submission.service'
import { ProcessedFieldResponse } from '../submission.types'
import {
  extractEmailConfirmationData,
  isAdminEmailPdfEnabled,
} from '../submission.utils'

import { SaveEncryptSubmissionParams } from './encrypt-submission.types'

const logger = createLoggerWithLabel(module)
const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

export const checkFormIsEncryptMode = (
  form: IPopulatedForm,
): Result<IPopulatedEncryptedForm, ResponseModeError> => {
  return isFormEncryptMode(form)
    ? ok(form)
    : err(new ResponseModeError(FormResponseMode.Encrypt, form.responseMode))
}

export const assertFormIsSingleSubmissionDisabled = (
  form: IPopulatedForm,
): Result<IPopulatedForm, UnsupportedSettingsError> => {
  return !form.isSingleSubmission
    ? ok(form)
    : err(
        new UnsupportedSettingsError(
          'isSingleSubmission cannot be enabled for payment forms as it is not currently supported',
        ),
      )
}

/**
 * Creates an encrypted submission without saving it to the database.
 * @param form Document of the form being submitted
 * @param encryptedContent Encrypted content of submission
 * @param version Encryption version
 * @param attachmentMetadata
 * @param verifiedContent Verified content included in submission, e.g. SingPass ID
 * @returns Encrypted submission document which has not been saved to database
 */
export const createEncryptSubmissionWithoutSave = ({
  form,
  encryptedContent,
  version,
  attachmentMetadata,
  verifiedContent,
}: SaveEncryptSubmissionParams): IEncryptedSubmissionSchema => {
  return new EncryptSubmissionModel({
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    encryptedContent,
    verifiedContent,
    attachmentMetadata,
    version,
  })
}

const checkIfAdminPdfIsRequired = (
  isPaymentEnabled: boolean,
  formFields: FormFieldSchema[],
  growthbook?: GrowthBook,
): boolean => {
  const isGbFlagEnabled =
    isAdminEmailPdfEnabled({ growthbook, formFields }) || isTest

  if (!isGbFlagEnabled) {
    return false
  }
  return !isPaymentEnabled
}

const checkIfRespondentFormSummaryIsRequired = ({
  autoReplyMailDatas,
  isPaymentEnabled,
}: {
  autoReplyMailDatas: AutoReplyMailData[]
  isPaymentEnabled: boolean
}): boolean => {
  return (
    !isPaymentEnabled &&
    autoReplyMailDatas.some((data) => data.includeFormSummary)
  )
}

const generatePdfAttachmentIfRequired = ({
  isPaymentEnabled,
  autoReplyMailDatas,
  submission,
  form,
  responsesData,
  growthbook,
}: {
  isPaymentEnabled: boolean
  autoReplyMailDatas: AutoReplyMailData[]
  submission: IEncryptedSubmissionSchema
  form: IPopulatedEncryptedForm
  responsesData: EmailDataField[]
  growthbook?: GrowthBook
}): ResultAsync<Mail.Attachment | undefined, AutoreplyPdfGenerationError> => {
  const isAdminPdfRequired = checkIfAdminPdfIsRequired(
    isPaymentEnabled,
    form.form_fields,
    growthbook,
  )
  const isRespondentCopyPdfRequired = checkIfRespondentFormSummaryIsRequired({
    isPaymentEnabled,
    autoReplyMailDatas,
  })
  if (!isAdminPdfRequired && !isRespondentCopyPdfRequired) {
    return okAsync(undefined)
  }

  const autoReplyData = {
    refNo: submission.id,
    formTitle: form.title,
    submissionDateTime: submission.created ?? new Date(),
    responsesData,
    formUrl: `${config.app.appUrl}/${form._id}`,
  }

  return generateAutoreplyPdf(autoReplyData)
    .map((pdfBuffer) => ({
      filename: `RefNo ${submission.id}.pdf`,
      content: Buffer.copyBytesFrom(pdfBuffer),
    }))
    .mapErr((error) => {
      logger.error({
        message:
          'Failed to include required PDF attachment for email notifications',
        meta: {
          action: 'generatePdfAttachmentIfRequired',
          submissionId: submission.id,
          formId: form._id,
          formResponseMode: form.responseMode,
          isAdminPdfRequired,
          isRespondentCopyPdfRequired,
        },
        error,
      })
      return error
    })
}

/**
 * Performs the post-submission actions for encrypt submissions. This is to be
 * called when the submission is completed
 * @param submission the completed submission
 * @param responses the verified field responses sent with the original submission request
 * @param emailFields fields and their responses that will be included in email notifications. May be undefined if the form is payment form.
 * @param submissionAttachments files from attachment fields in the submission that will be included in email notifications.
 * @returns ok(true) if all actions were completed successfully
 * @returns err(FormNotFoundError) if the form or form admin does not exist
 * @returns err(ResponseModeError) if the form is not encrypt mode
 * @returns err(WebhookValidationError) if the webhook URL failed validation
 * @returns err(WebhookPushToQueueError) if the webhook was failed to be pushed to SQS
 * @returns err(SubmissionNotFoundError) if there was an error updating the submission with the webhook record
 * @returns err(SendEmailConfirmationError) if any email failed to be sent
 * @returns err(PossibleDatabaseError) if error occurs whilst querying the database
 */
export const performEncryptPostSubmissionActions = ({
  submission,
  responses,
  emailFields,
  submissionAttachments,
  respondentEmails,
  growthbook,
}: {
  submission: IEncryptedSubmissionSchema
  responses: FieldResponse[]
  emailFields: ProcessedFieldResponse[]
  submissionAttachments?: Mail.Attachment[]
  respondentEmails?: string[]
  growthbook?: GrowthBook
}): ResultAsync<
  true,
  | FormNotFoundError
  | ResponseModeError
  | WebhookValidationError
  | WebhookPushToQueueError
  | SendEmailConfirmationError
  | SubmissionNotFoundError
  | PossibleDatabaseError
> => {
  const logMeta = {
    action: 'performEncryptPostSubmissionActions',
    submissionId: submission.id,
  }

  return FormService.retrieveFullFormById(submission.form)
    .andThen(checkFormIsEncryptMode)
    .andThen((form) => {
      // Fire webhooks if available
      // To avoid being coupled to latency of receiving system,
      // do not await on webhook
      const webhookUrl = form.webhook?.url
      if (!webhookUrl) return okAsync(form)

      return WebhookFactory.sendInitialWebhook(
        submission,
        webhookUrl,
        !!form.webhook?.isRetryEnabled,
      ).andThen(() => okAsync(form))
    })
    .andThen((form) => {
      // Add formId to growthbook attributes to allow for targeting in growthbook feature flags
      void growthbook?.setAttributes({
        ...growthbook?.getAttributes(),
        formId: form._id.toString(),
      })
      const respondentCopyEmailData: AutoReplyMailData[] = respondentEmails
        ? respondentEmails?.map((val) => {
            return {
              email: val,
              includeFormSummary: true,
            }
          })
        : []

      const { formData, dataCollationData } = new SubmissionEmailObj(
        emailFields,
        new Set(), // the MyInfo prefixes are already inserted in middleware
        form.authType,
      )
      // Since we insert the [MyInfo] prefix in `encrypt-submission.middleware.ts`:L434
      // we want to remove it for the dataCollationData
      const formattedDataCollationData = dataCollationData.map((item) => ({
        question: item.question.startsWith(MYINFO_PREFIX)
          ? item.question.slice(MYINFO_PREFIX.length)
          : item.question,
        answer: item.answer,
      }))
      const recipientEmailDatas = [
        ...extractEmailConfirmationData(responses, form.form_fields),
        ...respondentCopyEmailData,
      ]

      const isPaymentEnabled =
        form.responseMode === FormResponseMode.Encrypt &&
        form.payments_channel.channel !== PaymentChannel.Unconnected &&
        form.payments_field.enabled === true

      const pdfAttachmentResult = generatePdfAttachmentIfRequired({
        isPaymentEnabled,
        autoReplyMailDatas: recipientEmailDatas,
        submission,
        form,
        responsesData: formData,
        growthbook,
      }).orElse(() => okAsync(undefined))

      // TODO (email-standardisation): remove when email standardisation is GA
      const useStandardisedEmailTemplate: boolean =
        growthbook?.getFeatureValue(
          featureFlags.standardisedEmailTemplate,
          false,
        ) ?? false

      // TODO (formid-json): remove when Form ID in response JSON is GA
      const includeFormIdInResponseJson: boolean =
        growthbook?.getFeatureValue(featureFlags.formIdJson, false) ?? false

      return pdfAttachmentResult.andThen((pdfAttachment) => {
        return ResultAsync.combine([
          MailService.sendSubmissionToAdmin({
            replyToEmails:
              EmailSubmissionService.extractEmailAnswers(emailFields),
            form,
            submission: {
              created: submission.created,
              id: submission.id,
            },
            submissionAttachments,
            formData,
            dataCollationData: formattedDataCollationData,
            pdfAttachment: checkIfAdminPdfIsRequired(
              isPaymentEnabled,
              form.form_fields,
              growthbook,
            )
              ? pdfAttachment
              : undefined,
            useStandardisedEmailTemplate,
            includeFormIdInResponseJson,
          }).mapErr((error) => {
            logger.error({
              message:
                'Error while sending submission notification email to admin',
              meta: logMeta,
              error,
            })
            return error
          }),
          sendEmailConfirmations({
            form,
            submission,
            submissionAttachments,
            recipientData: recipientEmailDatas,
            responsesData: formData,
            pdfAttachment: checkIfRespondentFormSummaryIsRequired({
              isPaymentEnabled,
              autoReplyMailDatas: recipientEmailDatas,
            })
              ? pdfAttachment
              : undefined,
            isPaymentEnabled,
            useStandardisedEmailTemplate,
          }).mapErr((error) => {
            logger.error({
              message: 'Error while sending email confirmations to respondents',
              meta: logMeta,
              error,
            })
            return error
          }),
        ])
      })
    })
    .map(() => true)
}
