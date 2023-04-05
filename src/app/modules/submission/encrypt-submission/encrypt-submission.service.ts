import { ManagedUpload } from 'aws-sdk/clients/s3'
import Bluebird from 'bluebird'
import crypto from 'crypto'
import omit from 'lodash/omit'
import moment from 'moment'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { Transform } from 'stream'

import {
  FormResponseMode,
  StorageModeSubmissionMetadata,
  StorageModeSubmissionMetadataList,
  SubmissionPaymentDto,
} from '../../../../../shared/types'
import {
  IEncryptedSubmissionSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
  SubmissionCursorData,
  SubmissionData,
} from '../../../../types'
import { aws as AwsConfig } from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { isMalformedDate } from '../../../utils/date'
import { getMongoErrorMessage } from '../../../utils/handle-mongo-error'
import {
  AttachmentUploadError,
  DatabaseError,
  MalformedParametersError,
} from '../../core/core.errors'
import { CreatePresignedUrlError } from '../../form/admin-form/admin-form.errors'
import { isFormEncryptMode } from '../../form/form.utils'
import { PaymentNotFoundError } from '../../payments/payments.errors'
import * as PaymentsService from '../../payments/payments.service'
import {
  ResponseModeError,
  SubmissionNotFoundError,
} from '../submission.errors'

import {
  AttachmentMetadata,
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
 * Returns a cursor to the stream of the submissions of the given form id.
 *
 * @param formId the id of the form to stream responses for
 * @param dateRange optional. The date range to limit responses to
 *
 * @returns ok(stream cursor) if created successfully
 * @returns err(MalformedParametersError) if given dates are invalid dates
 */
export const getSubmissionCursor = (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): Result<
  ReturnType<typeof EncryptSubmissionModel.getSubmissionCursorByFormId>,
  MalformedParametersError
> => {
  if (
    isMalformedDate(dateRange.startDate) ||
    isMalformedDate(dateRange.endDate)
  ) {
    return err(new MalformedParametersError('Malformed date parameter'))
  }

  return ok(
    EncryptSubmissionModel.getSubmissionCursorByFormId(formId, dateRange),
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
    transform: (data: SubmissionCursorData, _encoding, callback) => {
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
 * Returns a Transform pipeline that transforms all attachment metadata of each
 * data chunk from the object path to the S3 signed URL so it can be retrieved
 * by the client.
 * @param enabled whether to perform any transformation
 * @param urlValidDuration how long to keep the S3 signed URL valid for
 * @returns a Transform pipeline to perform transformations on the pipe
 */
export const addPaymentDataStream = (): Transform => {
  return new Transform({
    objectMode: true,
    transform: async (data: SubmissionCursorData, _encoding, callback) => {
      if (!data.paymentId) {
        return callback(null, data)
      }

      return getSubmissionPaymentDto(data.paymentId).match(
        (payment) => {
          const returnData = {
            ...omit(data, 'paymentId'),
            payment,
          }
          return callback(null, returnData)
        },
        () => callback(null, data),
      )
    },
  })
}

/**
 * Retrieves required subset of encrypted submission data from the database
 * @param formId the id of the form to filter submissions for
 * @param submissionId the submission itself to retrieve
 * @returns ok(SubmissionData)
 * @returns err(SubmissionNotFoundError) if given submissionId does not exist in the database
 * @returns err(DatabaseError) when error occurs during query
 */
export const getEncryptedSubmissionData = (
  formId: string,
  submissionId: string,
): ResultAsync<SubmissionData, SubmissionNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    EncryptSubmissionModel.findEncryptedSubmissionById(formId, submissionId),
    (error) => {
      logger.error({
        message: 'Failure retrieving encrypted submission from database',
        meta: {
          action: 'getEncryptedSubmissionData',
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
 * Transforms given attachment metadata to their S3 signed url counterparts.
 * @param attachmentMetadata the metadata to transform
 * @param urlValidDuration the duration the S3 signed url will be valid for
 * @returns ok(map with object path replaced with their signed url counterparts)
 * @returns err(CreatePresignedUrlError) if any of the signed url creation processes results in an error
 */
export const transformAttachmentMetasToSignedUrls = (
  attachmentMetadata: Map<string, string> | undefined,
  urlValidDuration: number,
): ResultAsync<Record<string, string>, CreatePresignedUrlError> => {
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

      return new CreatePresignedUrlError('Failed to create attachment URL')
    },
  )
}

export const getSubmissionMetadata = (
  formId: string,
  submissionId: string,
): ResultAsync<StorageModeSubmissionMetadata | null, DatabaseError> => {
  // Early return, do not even retrieve from database.
  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return okAsync(null)
  }

  return ResultAsync.fromPromise(
    EncryptSubmissionModel.findSingleMetadata(formId, submissionId),
    (error) => {
      logger.error({
        message: 'Failure retrieving metadata from database',
        meta: {
          action: 'getSubmissionMetadata',
          formId,
          submissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}

export const getSubmissionMetadataList = (
  formId: string,
  page?: number,
): ResultAsync<StorageModeSubmissionMetadataList, DatabaseError> => {
  return ResultAsync.fromPromise(
    EncryptSubmissionModel.findAllMetadataByFormId(formId, { page }),
    (error) => {
      logger.error({
        message: 'Failure retrieving metadata page from database',
        meta: {
          action: 'getSubmissionMetadataList',
          formId,
          page,
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
