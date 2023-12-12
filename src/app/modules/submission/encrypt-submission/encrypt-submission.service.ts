import { InvokeCommandOutput } from '@aws-sdk/client-lambda'
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream/dist-types/blob/Uint8ArrayBlobAdapter'
import { ManagedUpload } from 'aws-sdk/clients/s3'
import Bluebird from 'bluebird'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { Writable } from 'stream'
import { validate } from 'uuid'

import {
  AttachmentPresignedPostDataMapType,
  AttachmentSizeMapType,
  DateString,
  FormResponseMode,
  SubmissionType,
} from '../../../../../shared/types'
import {
  FieldResponse,
  IEncryptedSubmissionSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
} from '../../../../types'
import { aws as AwsConfig } from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import {
  createPresignedPostDataPromise,
  CreatePresignedPostError,
} from '../../../utils/aws-s3'
import { createQueryWithDateParam } from '../../../utils/date'
import { getMongoErrorMessage } from '../../../utils/handle-mongo-error'
import {
  AttachmentUploadError,
  DatabaseError,
  PossibleDatabaseError,
} from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { isFormEncryptMode } from '../../form/form.utils'
import {
  WebhookPushToQueueError,
  WebhookValidationError,
} from '../../webhook/webhook.errors'
import { WebhookFactory } from '../../webhook/webhook.factory'
import {
  ResponseModeError,
  SendEmailConfirmationError,
  SubmissionNotFoundError,
} from '../submission.errors'
import { sendEmailConfirmations } from '../submission.service'
import {
  extractEmailConfirmationData,
  fileSizeLimitBytes,
} from '../submission.utils'

import {
  CHARTS_MAX_SUBMISSION_RESULTS,
  PRESIGNED_ATTACHMENT_POST_EXPIRY_SECS,
} from './encrypt-submission.constants'
import {
  AttachmentSizeLimitExceededError,
  DownloadCleanFileFailedError,
  InvalidFieldIdError,
  InvalidFileKeyError,
  JsonParseFailedError,
  MaliciousFileDetectedError,
  ParseVirusScannerLambdaPayloadError,
  VirusScanFailedError,
} from './encrypt-submission.errors'
import {
  AttachmentMetadata,
  bodyIsExpectedErrStructure,
  bodyIsExpectedOkStructure,
  ParseVirusScannerLambdaPayloadErrType,
  ParseVirusScannerLambdaPayloadOkType,
  payloadIsExpectedStructure,
  SaveEncryptSubmissionParams,
} from './encrypt-submission.types'

const logger = createLoggerWithLabel(module)
const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

type AttachmentReducerData = {
  attachmentMetadata: AttachmentMetadata // type alias for Map<string, string>
  attachmentUploadPromises: Promise<ManagedUpload.SendData>[]
}

/**
 * Uploads a set of submissions to S3 and returns a map of attachment IDs to S3 object keys
 *
 * @param formId the id of the form to upload attachments for
 * @param attachmentData Attachment blob data from the client (including the attachment)
 *
 * @returns ok(AttachmentMetadata) A map of field id to the s3 key of the uploaded attachment
 * @returns err(AttachmentUploadError) if the upload has failed
 */
export const uploadAttachments = (
  formId: string,
  attachmentData: Record<string, unknown>,
): ResultAsync<AttachmentMetadata, AttachmentUploadError> => {
  const { attachmentMetadata, attachmentUploadPromises } = Object.keys(
    attachmentData,
  ).reduce<AttachmentReducerData>(
    (accumulator: AttachmentReducerData, fieldId: string) => {
      const individualAttachment = JSON.stringify(attachmentData[fieldId])

      const hashStr = crypto
        .createHash('sha256')
        .update(individualAttachment)
        .digest('hex')

      const uploadKey =
        formId + '/' + crypto.randomBytes(20).toString('hex') + '/' + hashStr

      accumulator.attachmentMetadata.set(fieldId, uploadKey)
      accumulator.attachmentUploadPromises.push(
        AwsConfig.s3
          .upload({
            Bucket: AwsConfig.attachmentS3Bucket,
            Key: uploadKey,
            Body: Buffer.from(individualAttachment),
          })
          .promise(),
      )

      return accumulator
    },
    {
      attachmentMetadata: new Map<string, string>(),
      attachmentUploadPromises: [],
    },
  )

  return ResultAsync.fromPromise(
    Promise.all(attachmentUploadPromises),
    (error) => {
      logger.error({
        message: 'S3 attachment upload error',
        meta: {
          action: 'uploadAttachments',
          formId,
        },
        error,
      })
      return new AttachmentUploadError()
    },
  ).map(() => attachmentMetadata)
}

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

/**
 * Transforms given attachment metadata to their S3 signed url counterparts.
 * @param attachmentMetadata the metadata to transform
 * @param urlValidDuration the duration the S3 signed url will be valid for
 * @returns ok(map with object path replaced with their signed url counterparts)
 * @returns err(CreatePresignedPostError) if any of the signed url creation processes results in an error
 */
export const transformAttachmentMetasToSignedUrls = (
  attachmentMetadata: Map<string, string> | undefined,
  urlValidDuration: number,
): ResultAsync<Record<string, string>, CreatePresignedPostError> => {
  if (!attachmentMetadata) {
    return okAsync({})
  }
  const keyToSignedUrlPromises: Record<string, Promise<string>> = {}

  for (const [key, objectPath] of attachmentMetadata) {
    keyToSignedUrlPromises[key] = AwsConfig.s3.getSignedUrlPromise(
      'getObject',
      {
        Bucket: AwsConfig.attachmentS3Bucket,
        Key: objectPath,
        Expires: urlValidDuration,
      },
    )
  }

  return ResultAsync.fromPromise(
    Bluebird.props(keyToSignedUrlPromises),
    (error) => {
      logger.error({
        message: 'Failed to retrieve signed URLs for attachments',
        meta: {
          action: 'transformAttachmentMetasToSignedUrls',
          attachmentMetadata,
        },
        error,
      })

      return new CreatePresignedPostError('Failed to create attachment URL')
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

export const getQuarantinePresignedPostData = (
  attachmentSizes: AttachmentSizeMapType[],
): ResultAsync<
  AttachmentPresignedPostDataMapType[],
  CreatePresignedPostError
> => {
  // List of attachments is looped over twice to avoid side effects of mutating variables
  // to check if the attachment limits have been exceeded.

  // Step 1: Check for the total attachment size
  const totalAttachmentSizeLimit = fileSizeLimitBytes(FormResponseMode.Encrypt)
  const totalAttachmentSize = attachmentSizes
    .map(({ size }) => size)
    .reduce((prev, next) => prev + next, 0)
  if (totalAttachmentSize > totalAttachmentSizeLimit)
    return errAsync(new AttachmentSizeLimitExceededError())

  // Step 2: Create presigned post data for each attachment
  return ResultAsync.combine(
    attachmentSizes.map(({ id, size }) => {
      // Check if id is a valid ObjectId
      if (!mongoose.isValidObjectId(id))
        return errAsync(new InvalidFieldIdError())

      return createPresignedPostDataPromise({
        bucketName: AwsConfig.virusScannerQuarantineS3Bucket,
        expiresSeconds: PRESIGNED_ATTACHMENT_POST_EXPIRY_SECS,
        size,
      }).map((presignedPostData) => ({
        id,
        presignedPostData,
      }))
    }),
  )
}

const safeJSONParse = Result.fromThrowable(JSON.parse, (error) => {
  logger.error({
    message: 'Error while calling JSON.parse on MyInfo relay state',
    meta: {
      action: 'safeJSONParse',
      error,
    },
  })
  return new JsonParseFailedError()
})

/**
 * Parses the payload from the virus scanning lambda.
 * @param payload the payload from the virus scanning lambda
 * @returns ok(returnPayload) if payload is successfully parsed and virus scanning is successful
 * @returns err(returnPayload) if payload is successfully parsed and virus scanning is unsuccessful
 * @returns err(returnPayload) if payload cannot be parsed
 */
const parseVirusScannerLambdaPayload = (
  payload: Uint8ArrayBlobAdapter,
): Result<
  ParseVirusScannerLambdaPayloadOkType,
  ParseVirusScannerLambdaPayloadErrType
> => {
  const logMeta = {
    action: 'parseVirusScannerLambdaPayload',
    payload,
  }

  // Step 1: Parse whole payload received from lamda in to an object
  const parsedPayloadResult = safeJSONParse(Buffer.from(payload).toString())
  if (parsedPayloadResult.isErr()) {
    logger.error({
      message:
        'Error parsing payload from virus scanner lambda - payload JSON parsing failed',
      meta: logMeta,
    })

    return err(new ParseVirusScannerLambdaPayloadError())
  }

  const parsedPayload = payloadIsExpectedStructure(parsedPayloadResult.value)

  // Step 2a: Check if statusCode and body (unparsed) are of the correct types
  if (parsedPayload) {
    // Step 3: Parse body into an object
    const parsedBodyResult = safeJSONParse(
      Buffer.from(parsedPayload.body).toString(),
    )
    if (parsedBodyResult.isErr()) {
      logger.error({
        message:
          'Error parsing payload from virus scanner lambda - payload JSON parsing failed',
        meta: logMeta,
      })

      return err(new ParseVirusScannerLambdaPayloadError())
    }

    // Step 4a: If statusCode is 200, check if the body is of the correct type
    if (parsedPayload.statusCode === StatusCodes.OK) {
      const parsedBody = bodyIsExpectedOkStructure(parsedBodyResult.value)

      if (parsedBody) {
        // Step 5: If body is of the correct type, return ok with cleanFileKey and destinationVersionId
        const result = {
          statusCode: parsedPayload.statusCode as StatusCodes.OK,
          body: parsedBody,
        }
        logger.info({
          message:
            'Successfully parsed success payload from virus scanning lambda',
          meta: {
            ...logMeta,
            result,
          },
        })
        return ok(result)
      }

      logger.error({
        message:
          'Error parsing payload when statusCode is 200 from virus scanning lambda',
        meta: logMeta,
      })

      return err(new ParseVirusScannerLambdaPayloadError())
    }

    // Step 4b: If statusCode is not 200, check if the body is of the correct type (errored message)
    const parsedBody = bodyIsExpectedErrStructure(parsedBodyResult.value)

    if (parsedBody) {
      logger.info({
        message: 'Successfully parsed error payload from virus scanning lambda',
        meta: logMeta,
      })

      // Only place where error from virus scanning lambda is returned
      return err({
        statusCode: parsedPayload.statusCode,
        body: parsedBody,
      })
    }

    logger.error({
      message:
        'Error parsing payload when statusCode is number and body is string from virus scanning lambda',
      meta: logMeta,
    })

    return err(new ParseVirusScannerLambdaPayloadError())
  }

  // Step 2b: Return error if statusCode and body (unparsed) are of the wrong types

  logger.error({
    message:
      'Error parsing payload from virus scanner lambda - parsedPayload is undefined or wrong statusCode or body type',
    meta: logMeta,
  })

  return err(new ParseVirusScannerLambdaPayloadError())
}

/**
 * Invokes lambda to scan the file in the quarantine bucket for viruses.
 * @param quarantineFileKey object key of the file in the quarantine bucket
 * @returns okAsync(returnPayload) if file has been successfully scanned with status 200 OK
 * @returns errAsync(returnPayload) if lambda invocation failed or file cannot be found
 */
export const triggerVirusScanning = (
  quarantineFileKey: string,
): ResultAsync<
  ParseVirusScannerLambdaPayloadOkType,
  VirusScanFailedError | MaliciousFileDetectedError
> => {
  const logMeta = {
    action: 'triggerVirusScanning',
    quarantineFileKey,
  }

  if (!validate(quarantineFileKey)) {
    logger.error({
      message: 'Invalid quarantine file key - not a valid uuid',
      meta: logMeta,
    })

    return errAsync(new InvalidFileKeyError())
  }

  return ResultAsync.fromPromise(
    AwsConfig.virusScannerLambda.invoke({
      FunctionName: AwsConfig.virusScannerLambdaFunctionName,
      Payload: JSON.stringify({ key: quarantineFileKey }),
    }),
    (error) => {
      logger.error({
        message: 'Error encountered when invoking virus scanning lambda',
        meta: logMeta,
        error,
      })

      return new VirusScanFailedError()
    },
  ).andThen((data: InvokeCommandOutput) => {
    if (data && data.Payload)
      return parseVirusScannerLambdaPayload(data.Payload).mapErr((error) => {
        logger.error({
          message:
            'Error returned from virus scanning lambda or parsing lambda output',
          meta: logMeta,
          error: error,
        })

        if (error instanceof ParseVirusScannerLambdaPayloadError) return error
        else if (error.statusCode === StatusCodes.NOT_FOUND)
          return new InvalidFileKeyError(
            'Invalid file key - file key is not found in the quarantine bucket. The file must be uploaded first.',
          )
        else if (error.statusCode !== StatusCodes.BAD_REQUEST)
          return new VirusScanFailedError()

        return new MaliciousFileDetectedError()
      })

    // if data or data.Payload is undefined
    logger.error({
      message: 'data or data.Payload from virus scanner lambda is undefined',
      meta: logMeta,
    })

    return errAsync(new ParseVirusScannerLambdaPayloadError())
  })
}

/**
 * Downloads file from clean bucket
 * @param cleanFileKey object key of the file in the clean bucket
 * @param versionId id for versioning of the file in the clean bucket
 * @returns okAsync(buffer) if file has been successfully downloaded from the clean bucket
 * @returns errAsync(DownloadCleanFileFailedError) if file download failed
 */
export const downloadCleanFile = (cleanFileKey: string, versionId: string) => {
  const logMeta = {
    action: 'downloadCleanFile',
    cleanFileKey,
    versionId,
  }

  if (!validate(cleanFileKey)) {
    logger.error({
      message: 'Invalid clean file key - not a valid uuid',
      meta: logMeta,
    })

    return errAsync(new InvalidFileKeyError())
  }

  let buffer = Buffer.alloc(0)

  const writeStream = new Writable({
    write(chunk, _encoding, callback) {
      buffer = Buffer.concat([buffer, chunk])
      callback()
    },
  })

  const readStream = AwsConfig.s3
    .getObject({
      Bucket: AwsConfig.virusScannerCleanS3Bucket,
      Key: cleanFileKey,
      VersionId: versionId,
    })
    .createReadStream()

  readStream.pipe(writeStream)

  return ResultAsync.fromPromise(
    new Promise<Buffer>((resolve, reject) => {
      readStream.on('end', () => {
        resolve(buffer)
      })

      readStream.on('error', (error) => {
        reject(error)
      })
    }),
    (error) => {
      logger.error({
        message: 'Error encountered when downloading file from clean bucket',
        meta: logMeta,
        error,
      })

      return new DownloadCleanFileFailedError()
    },
  )
}
