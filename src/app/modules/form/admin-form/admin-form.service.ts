import { PresignedPost } from 'aws-sdk/clients/s3'
import mongoose from 'mongoose'
import { errAsync, ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import {
  MAX_UPLOAD_FILE_SIZE,
  VALID_UPLOAD_FILE_TYPES,
} from '../../../../shared/constants'
import {
  AuthType,
  DashboardFormView,
  IFieldSchema,
  IPopulatedForm,
  SpcpLocals,
} from '../../../../types'
import getFormModel from '../../../models/form.server.model'
import { getMongoErrorMessage } from '../../../utils/handle-mongo-error'
import { DatabaseError } from '../../core/core.errors'
import { MissingUserError } from '../../user/user.errors'
import { findAdminById } from '../../user/user.service'

import { PRESIGNED_POST_EXPIRY_SECS } from './admin-form.constants'
import {
  CreatePresignedUrlError,
  InvalidFileTypeError,
} from './admin-form.errors'

const logger = createLoggerWithLabel(module)
const FormModel = getFormModel(mongoose)

type PresignedPostParams = {
  fileId: string
  fileMd5Hash: string
  fileType: string
}

/**
 * Retrieves a list of forms that the user of the given userId can access in
 * their dashboard.
 * @param userId the id of the user to retrieve accessible forms for.
 * @returns ok(DashboardFormViewList)
 * @returns err(MissingUserError) if user with userId does not exist in the database
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const getDashboardForms = (
  userId: string,
): ResultAsync<DashboardFormView[], MissingUserError | DatabaseError> => {
  // Step 1: Verify user exists.
  return (
    findAdminById(userId)
      // Step 2: Retrieve lists users are authorized to see.
      .andThen((admin) => {
        return ResultAsync.fromPromise(
          FormModel.getDashboardForms(userId, admin.email),
          (error) => {
            logger.error({
              message: 'Database error when retrieving admin dashboard forms',
              meta: {
                action: 'getDashboardForms',
                userId,
              },
              error,
            })

            return new DatabaseError()
          },
        )
      })
  )
}

/**
 * Private function to generate a presigned POST URL to upload into the given
 * bucket.
 *
 * @param bucketName the name of the bucket to upload into
 * @param param.fileId key of the file
 * @param param.fileMd5Hash the MD5 hash of the file
 * @param param.fileType the file type of the file
 */
const createPresignedPost = (
  bucketName: string,
  { fileId, fileMd5Hash, fileType }: PresignedPostParams,
): ResultAsync<
  PresignedPost,
  InvalidFileTypeError | CreatePresignedUrlError
> => {
  if (!VALID_UPLOAD_FILE_TYPES.includes(fileType)) {
    return errAsync(
      new InvalidFileTypeError(`"${fileType}" is not a supported file type`),
    )
  }

  const presignedPostPromise = new Promise<PresignedPost>((resolve, reject) => {
    AwsConfig.s3.createPresignedPost(
      {
        Bucket: bucketName,
        Expires: PRESIGNED_POST_EXPIRY_SECS,
        Conditions: [
          // Content length restrictions: 0 to MAX_UPLOAD_FILE_SIZE.
          ['content-length-range', 0, MAX_UPLOAD_FILE_SIZE],
        ],
        Fields: {
          acl: 'public-read',
          key: fileId,
          'Content-MD5': fileMd5Hash,
          'Content-Type': fileType,
        },
      },
      (err, data) => {
        if (err) {
          return reject(err)
        }
        return resolve(data)
      },
    )
  })

  return ResultAsync.fromPromise(presignedPostPromise, (error) => {
    logger.error({
      message: 'Error encountered when creating presigned POST URL',
      meta: {
        action: 'createPresignedPost',
        fileId,
        fileMd5Hash,
        fileType,
      },
      error,
    })

    return new CreatePresignedUrlError('Error occurred whilst uploading file')
  })
}

/**
 * Creates a S3 presigned POST URL for the client to upload images directly to.
 *
 * @param param.fileId key of the file
 * @param param.fileMd5Hash the MD5 hash of the file
 * @param param.fileType the file type of the file
 *
 * @returns ok(presigned post url) when creation is successful
 * @returns err(InvalidFileTypeError) when given file type is not supported
 * @returns err(CreatePresignedUrlError) when errors occurs on S3 side whilst creating presigned post url.
 */
export const createPresignedPostForImages = (
  uploadParams: PresignedPostParams,
): ResultAsync<
  PresignedPost,
  InvalidFileTypeError | CreatePresignedUrlError
> => {
  return createPresignedPost(AwsConfig.imageS3Bucket, uploadParams)
}

/**
 * Creates a S3 presigned POST URL for the client to upload logos directly to.
 *
 * @param param.fileId key of the file
 * @param param.fileMd5Hash the MD5 hash of the file
 * @param param.fileType the file type of the file
 *
 * @returns ok(presigned post url) when creation is successful
 * @returns err(InvalidFileTypeError) when given file type is not supported
 * @returns err(CreatePresignedUrlError) when errors occurs on S3 side whilst creating presigned post url.
 */
export const createPresignedPostForLogos = (
  uploadParams: PresignedPostParams,
): ResultAsync<
  PresignedPost,
  InvalidFileTypeError | CreatePresignedUrlError
> => {
  return createPresignedPost(AwsConfig.logoS3Bucket, uploadParams)
}

export const getMockSpcpLocals = (
  authType: AuthType,
  formFields: IFieldSchema[] | undefined,
): SpcpLocals => {
  const myInfoFieldIds: string[] = formFields
    ? formFields
        .filter((field) => field.myInfo?.attr)
        .map((field) => field._id.toString())
    : []
  switch (authType) {
    case AuthType.SP:
      return {
        uinFin: 'S1234567A',
        hashedFields: new Set(myInfoFieldIds),
      }
    case AuthType.CP:
      return {
        uinFin: '123456789A',
        userInfo: 'ABC',
      }
    default:
      return {}
  }
}

/**
 * Archives given form.
 * @param form the form to archive
 * @returns ok(true) if successful
 * @returns err(DatabaseError) if any database errors occur
 */
export const archiveForm = (
  form: IPopulatedForm,
): ResultAsync<true, DatabaseError> => {
  return ResultAsync.fromPromise(form.archive(), (error) => {
    logger.error({
      message: 'Database error encountered when archiving form',
      meta: {
        action: 'archiveForm',
        form,
      },
      error,
    })

    return new DatabaseError(getMongoErrorMessage(error))
    // On success, return true
  }).map(() => true)
}
