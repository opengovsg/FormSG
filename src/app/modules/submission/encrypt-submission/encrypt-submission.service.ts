import mongoose from 'mongoose'
import { err, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  DateString,
  FormResponseMode,
  SubmissionType,
} from '../../../../../shared/types'
import {
  FieldResponse,
  IAttachmentInfo,
  IEncryptedSubmissionSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
} from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { createQueryWithDateParam } from '../../../utils/date'
import { getMongoErrorMessage } from '../../../utils/handle-mongo-error'
import { DatabaseError, PossibleDatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { isFormEncryptMode } from '../../form/form.utils'
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
} from '../submission.errors'
import { sendEmailConfirmations } from '../submission.service'
import {
  extractEmailConfirmationData,
  mapAttachmentsFromResponses,
} from '../submission.utils'

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
export const performEncryptPostSubmissionActions = (
  submission: IEncryptedSubmissionSchema,
  responses: FieldResponse[],
  emailData: SubmissionEmailObj,
  attachments?: IAttachmentInfo[],
): ResultAsync<
  true,
  | FormNotFoundError
  | ResponseModeError
  | WebhookValidationError
  | WebhookPushToQueueError
  | SendEmailConfirmationError
  | SubmissionNotFoundError
  | PossibleDatabaseError
> => {
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
      // Send Email Confirmations
      return sendEmailConfirmations({
        form,
        submission,
        attachments,
        responsesData: emailData.autoReplyData,
        recipientData: extractEmailConfirmationData(
          responses,
          form.form_fields,
        ),
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
}
