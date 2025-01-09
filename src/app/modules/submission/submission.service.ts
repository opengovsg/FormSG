import { InvokeCommandOutput } from '@aws-sdk/client-lambda'
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream/dist-types/blob/Uint8ArrayBlobAdapter'
import { ManagedUpload } from 'aws-sdk/clients/s3'
import Bluebird from 'bluebird'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import omit from 'lodash/omit'
import moment from 'moment'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { Transform, Writable } from 'stream'
import { validate } from 'uuid'

import {
  AttachmentPresignedPostDataMapType,
  AttachmentSizeMapType,
  FormResponseMode,
  SubmissionMetadata,
  SubmissionMetadataList,
  SubmissionPaymentDto,
} from '../../../../shared/types'
import {
  EmailRespondentConfirmationField,
  IAttachmentInfo,
  IEncryptSubmissionModel,
  IMultirespondentSubmissionModel,
  IPopulatedForm,
  ISubmissionSchema,
  StorageModeSubmissionCursorData,
  SubmissionData,
} from '../../../types'
import {
  ParsedClearAttachmentFieldResponseV3,
  ParsedClearAttachmentResponse,
  ParsedClearFormFieldResponse,
} from '../../../types/api'
import { aws as AwsConfig } from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import getPendingSubmissionModel from '../../models/pending_submission.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import MailService from '../../services/mail/mail.service'
import { AutoReplyMailData } from '../../services/mail/mail.types'
import {
  createPresignedPostDataPromise,
  CreatePresignedPostError,
} from '../../utils/aws-s3'
import { createQueryWithDateParam, isMalformedDate } from '../../utils/date'
import {
  getMongoErrorMessage,
  transformMongoError,
} from '../../utils/handle-mongo-error'
import {
  DatabaseDuplicateKeyError,
  DatabaseError,
  MalformedParametersError,
} from '../core/core.errors'
import { InvalidSubmissionIdError } from '../feedback/feedback.errors'
import { PaymentNotFoundError } from '../payments/payments.errors'
import * as PaymentsService from '../payments/payments.service'

import { PRESIGNED_ATTACHMENT_POST_EXPIRY_SECS } from './submission.constants'
import {
  AttachmentSizeLimitExceededError,
  AttachmentTooLargeError,
  AttachmentUploadError,
  DownloadCleanFileFailedError,
  InvalidFieldIdError,
  InvalidFileExtensionError,
  InvalidFileKeyError,
  JsonParseFailedError,
  MaliciousFileDetectedError,
  ParseVirusScannerLambdaPayloadError,
  PendingSubmissionNotFoundError,
  ResponseModeError,
  SendEmailConfirmationError,
  SubmissionNotFoundError,
  VirusScanFailedError,
} from './submission.errors'
import {
  AttachmentMetadata,
  bodyIsExpectedErrStructure,
  bodyIsExpectedOkStructure,
  ParseVirusScannerLambdaPayloadErrType,
  ParseVirusScannerLambdaPayloadOkType,
  payloadIsExpectedStructure,
} from './submission.types'
import {
  areAttachmentsMoreThanLimit,
  fileSizeLimitBytes,
  getEncryptedSubmissionModelByResponseMode,
  getInvalidFileExtensions,
  mapAttachmentsFromResponses,
} from './submission.utils'

const logger = createLoggerWithLabel(module)
const SubmissionModel = getSubmissionModel(mongoose)
const PendingSubmissionModel = getPendingSubmissionModel(mongoose)

/**
 * Returns number of form submissions of given form id in the given date range.
 *
 * @param formId the form id to retrieve submission counts for
 * @param dateRange optional date range to narrow down submission count
 * @param dateRange.startDate the start date of the date range
 * @param dateRange.endDate the end date of the date range
 *
 * @returns ok(form submission count)
 * @returns err(MalformedParametersError) if date range provided is malformed
 * @returns err(DatabaseError) if database query errors
 * @
 */
export const getFormSubmissionsCount = (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): ResultAsync<number, MalformedParametersError | DatabaseError> => {
  if (
    isMalformedDate(dateRange.startDate) ||
    isMalformedDate(dateRange.endDate)
  ) {
    return errAsync(new MalformedParametersError('Malformed date parameter'))
  }

  const countQuery = {
    form: formId,
    ...createQueryWithDateParam(dateRange?.startDate, dateRange?.endDate),
  }

  return ResultAsync.fromPromise(
    SubmissionModel.countDocuments(countQuery).exec(),
    (error) => {
      logger.error({
        message: 'Error counting submission documents from database',
        meta: {
          action: 'getFormSubmissionsCount',
          formId,
        },
        error,
      })

      return new DatabaseError()
    },
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

  const downloadStartTime = Date.now()
  logger.info({
    message: 'File download from S3 has started',
    meta: logMeta,
  })

  readStream.pipe(writeStream)

  return ResultAsync.fromPromise(
    new Promise<Buffer>((resolve, reject) => {
      readStream.on('end', () => {
        logger.info({
          message: 'Successfully downloaded file from S3',
          meta: logMeta,
        })
        const downloadEndTime = Date.now()
        logger.info({
          message: 'File download from S3 duration',
          meta: { ...logMeta, time: downloadEndTime - downloadStartTime },
        })

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

/**
 * Helper function to trigger virus scanning and download clean file.
 * @param response quarantined attachment response from storage submissions v2.1+.
 * @returns modified response with content replaced with clean file buffer and answer replaced with filename.
 */
export const triggerVirusScanThenDownloadCleanFileChain = <
  T extends
    | ParsedClearAttachmentResponse
    | ParsedClearAttachmentFieldResponseV3,
>(
  response: T,
  formId: string,
): ResultAsync<
  T,
  | VirusScanFailedError
  | DownloadCleanFileFailedError
  | MaliciousFileDetectedError
> => {
  const logMeta = {
    action: 'triggerVirusScanThenDownloadCleanFileChain',
    formId,
    quarantineFileKey: response.answer,
  }
  // Step 3: Trigger lambda to scan attachments.
  return (
    triggerVirusScanning(response.answer)
      .mapErr((error) => {
        if (error instanceof MaliciousFileDetectedError) {
          logger.error({
            message: 'Malicious file detected during lambda virus scan',
            meta: logMeta,
            error,
          })
          return new MaliciousFileDetectedError(response.filename)
        }
        return error
      })
      .map((lambdaOutput) => {
        logger.info({
          message:
            'Successfully retrieved clean file from virus scanning lambda',
          meta: { ...logMeta, cleanFileKey: lambdaOutput.body.cleanFileKey },
        })
        return lambdaOutput.body
      })
      // Step 4: Retrieve attachments from the clean bucket.
      .andThen((cleanAttachment) =>
        // Retrieve attachment from clean bucket.
        downloadCleanFile(
          cleanAttachment.cleanFileKey,
          cleanAttachment.destinationVersionId,
        ).map((attachmentBuffer) => ({
          ...response,
          // Replace content with attachmentBuffer and answer with filename.
          content: attachmentBuffer,
          answer: response.filename,
        })),
      )
  )
}

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
 * Sends email confirmation to form-fillers, for email fields with email confirmation
 * enabled.
 * @param param0 Data to include in email confirmations
 * @param param0.form Form object
 * @param param0.submission Submission object which was saved to database
 * @param param0.responsesData Subset of responses to be included in email confirmation
 * @param param0.attachments Attachments to be included in email
 * @param recipientData Array of objects that contains autoreply mail data to override with defaults
 * @returns ok(true) if all emails were sent successfully
 * @returns err(SendEmailConfirmationError) if any email failed to be sent
 */
export const sendEmailConfirmations = <S extends ISubmissionSchema>({
  form,
  submission,
  responsesData = [],
  attachments,
  recipientData,
}: {
  form: IPopulatedForm
  submission: S
  responsesData?: EmailRespondentConfirmationField[]
  attachments?: IAttachmentInfo[]
  recipientData: AutoReplyMailData[]
}): ResultAsync<true, SendEmailConfirmationError> => {
  const logMeta = {
    action: 'sendEmailConfirmations',
    formId: form._id,
    submissionid: submission._id,
  }
  if (recipientData.length === 0) {
    return okAsync(true)
  }
  const sentEmailsPromise = MailService.sendAutoReplyEmails({
    form,
    submission,
    attachments,
    responsesData,
    autoReplyMailDatas: recipientData,
  })
  return ResultAsync.fromPromise(sentEmailsPromise, (error) => {
    logger.error({
      message: 'Error while attempting to send email confirmations',
      meta: logMeta,
      error,
    })
    return new SendEmailConfirmationError()
  }).andThen((emailResults) => {
    const errors = emailResults.reduce<string[]>((acc, singleEmail) => {
      if (singleEmail.status === 'rejected') {
        acc.push(singleEmail.reason)
      }
      return acc
    }, [])
    if (errors.length > 0) {
      logger.error({
        message: 'Some email confirmations could not be sent',
        meta: { ...logMeta, errors },
      })
      return errAsync(new SendEmailConfirmationError())
    }
    return okAsync(true as const)
  })
}

/**
 * Checks if submissionId exists amongst all the form submissions.
 *
 * @param submissionId the submission id to find amongst all the form submissions
 *
 * @returns ok(true) if submission id exists amongst all the form submissions
 * @returns err(InvalidSubmissionIdError) if submissionId does not exist amongst all the form submissions
 * @returns err(DatabaseError) if database query errors
 */
export const doesSubmissionIdExist = (
  submissionId: string,
): ResultAsync<true, InvalidSubmissionIdError | DatabaseError> =>
  ResultAsync.fromPromise(
    SubmissionModel.exists({
      _id: submissionId,
    }).exec(),
    (error) => {
      logger.error({
        message: 'Error finding _id from submissions collection in database',
        meta: {
          action: 'doesSubmissionIdExist',
          submissionId,
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((hasSubmissionId) => {
    if (!hasSubmissionId) {
      return errAsync(new InvalidSubmissionIdError())
    }
    return okAsync(true as const)
  })

export const getSubmissionMetadata = (
  responseMode: FormResponseMode,
  formId: string,
  submissionId: string,
): ResultAsync<
  SubmissionMetadata | null,
  ResponseModeError | DatabaseError
> => {
  // Early return, do not even retrieve from database.
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return okAsync(null)
  }

  return getEncryptedSubmissionModelByResponseMode(responseMode).asyncAndThen(
    (modelToUse) =>
      ResultAsync.fromPromise(
        modelToUse.findSingleMetadata(formId, submissionId),
        (error) => {
          logger.error({
            message: 'Failure retrieving metadata from database',
            meta: {
              action: 'getSubmissionMetadata',
              responseMode,
              formId,
              submissionId,
            },
            error,
          })
          return new DatabaseError(getMongoErrorMessage(error))
        },
      ),
  )
}

export const getSubmissionMetadataList = (
  responseMode: FormResponseMode,
  formId: string,
  page?: number,
): ResultAsync<SubmissionMetadataList, ResponseModeError | DatabaseError> =>
  getEncryptedSubmissionModelByResponseMode(responseMode).asyncAndThen(
    (modelToUse) =>
      ResultAsync.fromPromise(
        modelToUse.findAllMetadataByFormId(formId, { page }),
        (error) => {
          logger.error({
            message: 'Failure retrieving metadata page from database',
            meta: {
              action: 'getSubmissionMetadataList',
              responseMode,
              formId,
              page,
            },
            error,
          })
          return new DatabaseError(getMongoErrorMessage(error))
        },
      ),
  )

/**
 * Retrieves required subset of encrypted submission data from the database
 * @param formId the id of the form to filter submissions for
 * @param submissionId the submission itself to retrieve
 * @returns ok(SubmissionData)
 * @returns err(SubmissionNotFoundError) if given submissionId does not exist in the database
 * @returns err(DatabaseError) when error occurs during query
 */
export const getEncryptedSubmissionData = (
  responseMode: FormResponseMode,
  formId: string,
  submissionId: string,
): ResultAsync<
  SubmissionData,
  ResponseModeError | SubmissionNotFoundError | DatabaseError
> =>
  getEncryptedSubmissionModelByResponseMode(responseMode).asyncAndThen(
    (modelToUse) =>
      ResultAsync.fromPromise(
        modelToUse.findEncryptedSubmissionById(
          formId,
          submissionId,
        ) as Promise<SubmissionData | null>,
        (error) => {
          logger.error({
            message: 'Failure retrieving encrypted submission from database',
            meta: {
              action: 'getEncryptedSubmissionData',
              responseMode,
              formId,
              submissionId,
            },
            error,
          })
          return new DatabaseError(getMongoErrorMessage(error))
        },
      ).andThen((submission) => {
        if (!submission) {
          logger.error({
            message: 'Unable to find encrypted submission from database',
            meta: {
              action: 'getEncryptedResponse',
              formId,
              submissionId,
            },
          })
          return errAsync(
            new SubmissionNotFoundError(
              'Unable to find encrypted submission from database',
            ),
          )
        }
        return okAsync(submission)
      }),
  )

/**
 * Returns a cursor to the stream of the submissions of the given form id.
 *
 * @param formId the id of the form to stream responses for
 * @param dateRange optional. The date range to limit responses to
 *
 * @returns ok(stream cursor) if created successfully
 * @returns err(MalformedParametersError) if given dates are invalid dates
 */
export const getSubmissionCursor = (
  responseMode: FormResponseMode,
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): Result<
  ReturnType<
    | IEncryptSubmissionModel['getSubmissionCursorByFormId']
    | IMultirespondentSubmissionModel['getSubmissionCursorByFormId']
  >,
  MalformedParametersError
> => {
  if (
    isMalformedDate(dateRange.startDate) ||
    isMalformedDate(dateRange.endDate)
  ) {
    return err(new MalformedParametersError('Malformed date parameter'))
  }

  return getEncryptedSubmissionModelByResponseMode(responseMode).andThen(
    (modelToUse) =>
      ok(modelToUse.getSubmissionCursorByFormId(formId, dateRange)),
  )
}

/**
 * Returns a Transform pipeline that transforms all attachment metadata of each
 * data chunk from the object path to the S3 signed URL so it can be retrieved
 * by the client.
 * @param enabled whether to perform any transformation
 * @param urlValidDuration how long to keep the S3 signed URL valid for
 * @returns a Transform pipeline to perform transformations on the pipe
 */
export const transformAttachmentMetaStream = ({
  enabled,
  urlValidDuration,
}: {
  enabled: boolean
  urlValidDuration: number
}): Transform => {
  return new Transform({
    objectMode: true,
    transform: (data: StorageModeSubmissionCursorData, _encoding, callback) => {
      const unprocessedMetadata = data.attachmentMetadata ?? {}

      const totalCount = Object.keys(unprocessedMetadata).length
      // Early return if pipe is disabled or nothing to transform.
      if (!enabled || totalCount === 0) {
        data.attachmentMetadata = {}
        return callback(null, data)
      }

      const transformedMetadata: Record<string, string> = {}
      let processedCount = 0

      for (const [key, objectPath] of Object.entries(unprocessedMetadata)) {
        AwsConfig.s3.getSignedUrl(
          'getObject',
          {
            Bucket: AwsConfig.attachmentS3Bucket,
            Key: objectPath,
            Expires: urlValidDuration,
          },
          (error, url) => {
            if (error) {
              logger.error({
                message: 'Error occured whilst retrieving signed URL from S3',
                meta: {
                  action: 'transformAttachmentMetaStream',
                  key,
                  objectPath,
                },
                error,
              })
              return callback(error)
            }

            transformedMetadata[key] = url
            processedCount += 1

            // Finished processing, replace current attachment metadata with the
            // signed URLs.
            if (processedCount === totalCount) {
              data.attachmentMetadata = transformedMetadata
              return callback(null, data)
            }
          },
        )
      }
    },
  })
}

/**
 * Returns a Transform pipeline that expands the payment id of each submission
 * to its corresponding payment object with information in SubmissionPaymentDto.
 * @returns a Transform pipeline to perform transformations on the pipe
 */
export const addPaymentDataStream = (): Transform => {
  return new Transform({
    objectMode: true,
    transform: async (
      data: StorageModeSubmissionCursorData,
      _encoding,
      callback,
    ) => {
      if (!data.paymentId) {
        return callback(null, data)
      }

      const { paymentId, ...rest } = data

      return getSubmissionPaymentDto(paymentId).match(
        (payment) => callback(null, { ...rest, payment }),
        () => callback(null, rest),
      )
    },
  })
}

/**
 * Gets completed payment details associated with a particular submission for a
 * given paymentId.
 * @param paymentId the payment
 * @requires paymentId must be a completed payment
 *
 * @returns ok(SubmissionPayment)
 * @returns err(PaymentNotFoundError) if the paymentId does not reference a payment, or if the payment is incomplete
 * @returns err(DatabaseError) if mongoose threw an error during the process
 */
export const getSubmissionPaymentDto = (
  paymentId: string,
): ResultAsync<SubmissionPaymentDto, PaymentNotFoundError | DatabaseError> =>
  PaymentsService.findPaymentById(paymentId).andThen((payment) => {
    // If the payment is incomplete, the "complete payment" is not found. This
    // also implies an internal consistency error.
    if (!payment.completedPayment) return errAsync(new PaymentNotFoundError())

    return okAsync({
      id: payment._id,
      paymentIntentId: payment.paymentIntentId,
      email: payment.email,
      products: payment.products
        ?.filter((product) => product.selected)
        .map((product) => ({
          name: product.data.name,
          quantity: product.quantity,
        })),
      amount: payment.amount,
      status: payment.status,

      paymentDate: moment(payment.completedPayment.paymentDate)
        .tz('Asia/Singapore')
        .format('ddd, D MMM YYYY, hh:mm:ss A'),
      transactionFee: payment.completedPayment.transactionFee,
      receiptUrl: payment.completedPayment.receiptUrl,

      payoutId: payment.payout?.payoutId,
      payoutDate:
        payment.payout?.payoutDate &&
        moment(payment.payout.payoutDate)
          .tz('Asia/Singapore')
          .format('ddd, D MMM YYYY'),
    })
  })

/**
 * @param submissionId the submission id to find amongst all the form submissions
 *
 * @returns ok(submission document) if retrieval is successful
 * @returns err(SubmissionNotFoundError) if submission does not exist in the database
 * @returns err(DatabaseError) if database errors occurs whilst retrieving user
 */
export const findSubmissionById = (
  submissionId: string,
): ResultAsync<ISubmissionSchema, DatabaseError | SubmissionNotFoundError> => {
  return ResultAsync.fromPromise(
    SubmissionModel.findById(submissionId).exec(),
    (error) => {
      logger.error({
        message: 'Database find submission error',
        meta: {
          action: 'findSubmissionById',
          submissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((submission) => {
    if (!submission) {
      return errAsync(new SubmissionNotFoundError())
    }
    return okAsync(submission)
  })
}

/**
 * Copies a pending submission by ID to the submission collection. For correctness,
 * this should always be done within a transaction, thus a session must be provided.
 *
 * @param pendingSubmissionId the id of the pending submission to confirm
 * @param session the mongoose transaction session to be used, if any
 *
 * @returns ok(submission document) if a submission document is successfully created
 * @returns err(PendingSubmissionNotFoundError) if pending submission does not exist in the database
 * @returns err(DatabaseError) if database errors occurs while copying the document over
 */
export const copyPendingSubmissionToSubmissions = (
  pendingSubmissionId: string,
  session: mongoose.ClientSession,
): ResultAsync<
  ISubmissionSchema,
  DatabaseError | PendingSubmissionNotFoundError
> => {
  const logMeta = {
    action: 'confirmPendingSubmission',
    pendingSubmissionId,
  }
  return ResultAsync.fromPromise(
    PendingSubmissionModel.findById(pendingSubmissionId, null, {
      // readPreference from transaction isn't respected, thus we are setting it on operation
      readPreference: 'primary',
    }).session(session),
    (error) => {
      logger.error({
        message: 'Database find pending submission error',
        meta: logMeta,
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
    .andThen((submission) => {
      if (!submission) {
        return errAsync(new PendingSubmissionNotFoundError())
      }
      return okAsync(submission)
    })
    .andThen((pendingSubmission) => {
      const submissionContent = omit(pendingSubmission, [
        '_id',
        'created',
        'lastModified',
      ])
      const submission = new SubmissionModel({
        // Explicitly copy over the pending submission's _id
        ...submissionContent,
        _id: pendingSubmissionId,
      })

      return ResultAsync.fromPromise(submission.save({ session }), (error) => {
        logger.error({
          message: 'Database save submission error',
          meta: logMeta,
          error,
        })
        return transformMongoError(error)
      }).orElse((error) => {
        const isDuplicateKeyError = error instanceof DatabaseDuplicateKeyError

        if (!isDuplicateKeyError) {
          return errAsync(new DatabaseError(getMongoErrorMessage(error)))
        }

        // Failed to save due to duplicate keys.
        logger.error({
          message:
            'Failed to move pending submission to submission: duplicate key error in submission collection',
          meta: logMeta,
          error,
        })

        // Recover by attempting to save with a different id.
        const recoverySubmission = new SubmissionModel(submissionContent)
        // TODO: Set alarms for both branches
        return ResultAsync.fromPromise(
          recoverySubmission.save({ session }),
          (error) => {
            logger.error({
              message: 'Failed to recover from duplicate key error',
              meta: logMeta,
              error,
            })
            return new DatabaseError(getMongoErrorMessage(error))
          },
        ).andThen((recoverySubmission) => {
          logger.warn({
            message: `Successfully recovered from duplicate key error`,
            meta: {
              submissionId: recoverySubmission._id,
              ...logMeta,
            },
            error,
          })
          return okAsync(recoverySubmission)
        })
      })
    })
}

/**
 * Validates that the attachments in a submission do not violate form-level
 * constraints e.g. form-wide attachment size limit.
 * @param parsedResponses Unprocessed responses
 * @returns okAsync(true) if validation passes
 * @returns errAsync(InvalidFileExtensionError) if invalid file extensions are found
 * @returns errAsync(AttachmentTooLargeError) if total attachment size exceeds 7MB
 */
export const validateAttachments = (
  parsedResponses: ParsedClearFormFieldResponse[],
  responseMode: FormResponseMode,
): ResultAsync<true, InvalidFileExtensionError | AttachmentTooLargeError> => {
  const logMeta = { action: 'validateAttachments', responseMode }
  const attachments = mapAttachmentsFromResponses(parsedResponses)
  if (areAttachmentsMoreThanLimit(attachments, responseMode)) {
    logger.error({
      message: 'Attachment size is too large',
      meta: logMeta,
    })
    return errAsync(new AttachmentTooLargeError())
  }
  return ResultAsync.fromPromise(
    getInvalidFileExtensions(attachments),
    (error) => {
      logger.error({
        message: 'Error while validating attachment file extensions',
        meta: logMeta,
        error,
      })
      return new InvalidFileExtensionError()
    },
  ).andThen((invalidExtensions) => {
    if (invalidExtensions.length > 0) {
      logger.error({
        message: 'Invalid file extensions found',
        meta: {
          ...logMeta,
          invalidExtensions,
        },
      })
      return errAsync(new InvalidFileExtensionError())
    }
    return okAsync(true as const)
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
