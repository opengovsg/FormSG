import { GrowthBook } from '@growthbook/growthbook'
import mongoose from 'mongoose'
import { err, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import Mail from 'nodemailer/lib/mailer'

import { AutoReplyMailData, AutoreplySummaryRenderData } from 'src/app/services/mail/mail.types'
import MailService from '../../../services/mail/mail.service'
import * as EmailSubmissionService from '../email-submission/email-submission.service'

import { featureFlags } from '../../../../../shared/constants'
import {
  DateString,
  FormResponseMode,
  PaymentChannel,
  SubmissionType,
} from '../../../../../shared/types'
import {
  EmailAdminDataField,
  FieldResponse, IEncryptedSubmissionSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm
} from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { createQueryWithDateParam } from '../../../utils/date'
import { getMongoErrorMessage } from '../../../utils/handle-mongo-error'
import { DatabaseError, PossibleDatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { isFormEncryptMode } from '../../form/form.utils'
import * as UserService from '../../user/user.service'
import {
  WebhookPushToQueueError,
  WebhookValidationError,
} from '../../webhook/webhook.errors'
import { WebhookFactory } from '../../webhook/webhook.factory'
import { SubmissionEmailObj } from '../email-submission/email-submission.util'
import {
  ResponseModeError,
  SendEmailConfirmationError,
  SubmissionNotFoundError,
  UnsupportedSettingsError,
} from '../submission.errors'
import { sendEmailConfirmations } from '../submission.service'
import { extractEmailConfirmationData } from '../submission.utils'

import moment from 'moment'
import { AutoreplyPdfGenerationError } from 'src/app/services/mail/mail.errors'
import { generateAutoreplyPdf } from 'src/app/services/mail/mail.utils'
import { MYINFO_PREFIX } from '../email-submission/email-submission.constants'
import { ProcessedFieldResponse } from '../submission.types'
import { CHARTS_MAX_SUBMISSION_RESULTS } from './encrypt-submission.constants'
import { SaveEncryptSubmissionParams } from './encrypt-submission.types'

const logger = createLoggerWithLabel(module)
const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

/**
 * Retrieves all encrypted submission data from the database
 * - up to the 1000th submission, sorted in reverse chronological order
 * - this query uses 'form_1_submissionType_1_created_-1' index
 * @param formId the id of the form to filter submissions for
 * @returns ok(SubmissionData)
 * @returns err(DatabaseError) when error occurs during query
 */
export const getAllEncryptedSubmissionData = (
  formId: string,
  startDate?: DateString,
  endDate?: DateString,
) => {
  const findQuery = {
    form: formId,
    submissionType: SubmissionType.Encrypt,
    ...createQueryWithDateParam(startDate, endDate),
  }
  return ResultAsync.fromPromise(
    EncryptSubmissionModel.find(findQuery)
      .limit(CHARTS_MAX_SUBMISSION_RESULTS)
      .sort({ created: -1 }),
    (error) => {
      logger.error({
        message: 'Failure retrieving encrypted submission from database',
        meta: {
          action: 'getEncryptedSubmissionData',
          formId,
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}

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

const checkIfAdminPdfIsRequired = (): boolean => {
  return true
}

const checkIfRespondentFormSummaryIsRequired = ({
  autoReplyMailDatas,
  isPaymentEnabled,
}: {
  autoReplyMailDatas: AutoReplyMailData[]
  isPaymentEnabled: boolean
}): boolean => {
  return !isPaymentEnabled && autoReplyMailDatas.some((data) => data.includeFormSummary)
}

const checkIfPdfGenerationIsRequired = ({
  isPaymentEnabled,
  autoReplyMailDatas,
}: {
  isPaymentEnabled: boolean
  autoReplyMailDatas: AutoReplyMailData[]
}): boolean => {
  return checkIfAdminPdfIsRequired() || checkIfRespondentFormSummaryIsRequired({
    isPaymentEnabled,
    autoReplyMailDatas,
  })
}

const generatePdfAttachmentIfRequired = ({
  isPaymentEnabled,
  autoReplyMailDatas,
  submission,
  form,
  responsesData,
}: {
  isPaymentEnabled: boolean
  autoReplyMailDatas: AutoReplyMailData[]
  submission: IEncryptedSubmissionSchema
  form: IPopulatedEncryptedForm
  responsesData: (Pick<EmailAdminDataField, 'question' | 'answerTemplate'> & {
    answer?: EmailAdminDataField['answer']
  })[]
}): ResultAsync<Mail.Attachment | undefined, AutoreplyPdfGenerationError> => {
  if (!checkIfPdfGenerationIsRequired({
    isPaymentEnabled,
    autoReplyMailDatas,
  })) {
    return okAsync(undefined)
  }

  const renderData: AutoreplySummaryRenderData = {
    refNo: submission.id,
    formTitle: form.title,
    submissionTime: moment(submission.created)
      .tz('Asia/Singapore')
      .format('ddd, DD MMM YYYY hh:mm:ss A'),
    formData: responsesData,
    formUrl: `${config.app.appUrl}/${form._id}`,
  }

  return generateAutoreplyPdf(
    renderData,
    true,
  ).map((pdfBuffer) => ({
    filename: 'response.pdf',
    content: Buffer.copyBytesFrom(pdfBuffer),
  }))
}

/**
 * Performs the post-submission actions for encrypt submissions. This is to be
 * called when the submission is completed
 * @param submission the completed submission
 * @param responses the verified field responses sent with the original submission request
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
  growthbook,
  emailFields,
  attachments,
  respondentEmails,
}: {
  submission: IEncryptedSubmissionSchema
  responses: FieldResponse[]
  growthbook?: GrowthBook
  emailFields: ProcessedFieldResponse[]
  attachments?: Mail.Attachment[]
  respondentEmails?: string[]
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

  return (
    FormService.retrieveFullFormById(submission.form)
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
      // TODO [PDF-LAMBDA-GENERATION]: Remove setting of Growthbook targetting once pdf generation rollout is complete
      .map(async (form) => {
        await UserService.getPopulatedUserById(form.admin).map(
          async (admin) => {
            await growthbook?.setAttributes({
              ...growthbook?.getAttributes(),
              formId: submission.form.toString(),
              adminEmail: admin.email,
              adminAgency: admin.agency.shortName,
            })
          },
        )
        return form
      })
      .andThen((form) => {
        const respondentCopyEmailData: AutoReplyMailData[] = respondentEmails
          ? respondentEmails?.map((val) => {
            return {
              email: val,
              includeFormSummary: true,
            }
          })
          : []

        // TODO [PDF-LAMBDA-GENERATION]: Remove setting of Growthbook targetting once pdf generation rollout is complete
        const isUseLambdaOutput =
          growthbook?.isOn(featureFlags.lambdaPdfGeneration) ?? false
        logger.info({
          message: 'Growthbook flag for lambda pdf generation',
          meta: {
            ...logMeta,
            isUseLambdaOutput,
            growthbookAttributes: growthbook?.getAttributes(),
            lambdaPdfGenerationGrowthbookValue: growthbook?.getFeatureValue(
              featureFlags.lambdaPdfGeneration,
              undefined,
            ),
          },
        })

        const emailData = new SubmissionEmailObj(
          emailFields,
          new Set(), // the MyInfo prefixes are already inserted in middleware
          form.authType,
        )

        // Since we insert the [MyInfo] prefix in `encrypt-submission.middleware.ts`:L434
        // we want to remove it for the dataCollationData
        const dataCollationData = emailData.dataCollationData.map((item) => ({
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
          responsesData: emailData.formData,
        })

        return pdfAttachmentResult.andThen((pdfAttachment) => {
          void MailService.sendSubmissionToAdmin({
            replyToEmails: EmailSubmissionService.extractEmailAnswers(emailFields),
            form,
            submission: {
              created: submission.created,
              id: submission.id,
            },
            attachments,
            formData: emailData.formData,
            dataCollationData,
          })

          return sendEmailConfirmations({
            form,
            submission,
            attachments,
            responsesData: emailData?.autoReplyData,
            recipientData: recipientEmailDatas,
            pdfAttachment,
          }).mapErr((error) => {
            logger.error({
              message: 'Error while sending email confirmations',
              meta: {
                action: 'sendEmailAutoReplies',
              },
              error,
            })
            return error
          })
        })
      })
  )
}
