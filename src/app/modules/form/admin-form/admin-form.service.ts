import { PresignedPost } from 'aws-sdk/clients/s3'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { Merge } from 'type-fest'

import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import {
  MAX_UPLOAD_FILE_SIZE,
  VALID_UPLOAD_FILE_TYPES,
} from '../../../../shared/constants'
import {
  AuthType,
  FormLogoState,
  FormMetaView,
  IFieldSchema,
  IForm,
  IFormDocument,
  IFormSchema,
  IPopulatedForm,
  IUserSchema,
  SpcpLocals,
} from '../../../../types'
import getFormModel from '../../../models/form.server.model'
import {
  getMongoErrorMessage,
  transformMongoError,
} from '../../../utils/handle-mongo-error'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from '../../core/core.errors'
import { MissingUserError } from '../../user/user.errors'
import * as UserService from '../../user/user.service'
import { FormNotFoundError, TransferOwnershipError } from '../form.errors'

import { PRESIGNED_POST_EXPIRY_SECS } from './admin-form.constants'
import {
  CreatePresignedUrlError,
  InvalidFileTypeError,
} from './admin-form.errors'
import { DuplicateFormBody } from './admin-form.types'
import { processDuplicateOverrideProps } from './admin-form.utils'

const logger = createLoggerWithLabel(module)
const FormModel = getFormModel(mongoose)

type PresignedPostUrlParams = {
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
): ResultAsync<FormMetaView[], MissingUserError | DatabaseError> => {
  // Step 1: Verify user exists.
  return (
    UserService.findUserById(userId)
      // Step 2: Retrieve lists users are authorized to see.
      .andThen((admin) => {
        return ResultAsync.fromPromise(
          FormModel.getMetaByUserIdOrEmail(userId, admin.email),
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
const createPresignedPostUrl = (
  bucketName: string,
  { fileId, fileMd5Hash, fileType }: PresignedPostUrlParams,
): ResultAsync<
  PresignedPost,
  InvalidFileTypeError | CreatePresignedUrlError
> => {
  if (!VALID_UPLOAD_FILE_TYPES.includes(fileType)) {
    return errAsync(
      new InvalidFileTypeError(`"${fileType}" is not a supported file type`),
    )
  }

  const presignedPostUrlPromise = new Promise<PresignedPost>(
    (resolve, reject) => {
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
    },
  )

  return ResultAsync.fromPromise(presignedPostUrlPromise, (error) => {
    logger.error({
      message: 'Error encountered when creating presigned POST URL',
      meta: {
        action: 'createPresignedPostUrl',
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
export const createPresignedPostUrlForImages = (
  uploadParams: PresignedPostUrlParams,
): ResultAsync<
  PresignedPost,
  InvalidFileTypeError | CreatePresignedUrlError
> => {
  return createPresignedPostUrl(AwsConfig.imageS3Bucket, uploadParams)
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
export const createPresignedPostUrlForLogos = (
  uploadParams: PresignedPostUrlParams,
): ResultAsync<
  PresignedPost,
  InvalidFileTypeError | CreatePresignedUrlError
> => {
  return createPresignedPostUrl(AwsConfig.logoS3Bucket, uploadParams)
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

/**
 * Transfer form ownership from current owner to the new email.
 * @param currentForm the form to transfer ownership for
 * @param newOwnerEmail the email of the new owner to transfer to
 *
 * @return ok(updated form) if transfer is successful
 * @return err(MissingUserError) if the current form admin cannot be found
 * @return err(TransferOwnershipError) if new owner cannot be found in the database or new owner email is same as current owner
 * @return err(DatabaseError) if any database errors like missing admin of current owner occurs
 */
export const transferFormOwnership = (
  currentForm: IPopulatedForm,
  newOwnerEmail: string,
): ResultAsync<IPopulatedForm, TransferOwnershipError | DatabaseError> => {
  const logMeta = {
    action: 'transferFormOwnership',
    newOwnerEmail,
  }

  return (
    // Step 1: Retrieve current owner of form to transfer.
    UserService.findUserById(currentForm.admin._id)
      .andThen((currentOwner) => {
        // No need to transfer form ownership if new and current owners are
        // the same.
        if (newOwnerEmail === currentOwner.email) {
          return errAsync(
            new TransferOwnershipError(
              'You are already the owner of this form',
            ),
          ) as ResultAsync<IUserSchema, TransferOwnershipError | DatabaseError>
        }
        return okAsync(currentOwner)
      })
      .andThen((currentOwner) =>
        // Step 2: Retrieve user document for new owner.
        UserService.findUserByEmail(newOwnerEmail)
          .mapErr((error) => {
            logger.error({
              message:
                'Error occurred whilst finding new owner email to transfer ownership to',
              meta: logMeta,
              error,
            })

            // Override MissingUserError with more specific message if new owner
            // cannot be found.
            if (error instanceof MissingUserError) {
              return new TransferOwnershipError(
                `${newOwnerEmail} must have logged in once before being added as Owner`,
              )
            }
            return error
          })
          // Step 3: Perform form ownership transfer.
          .andThen((newOwner) =>
            ResultAsync.fromPromise(
              currentForm.transferOwner<IPopulatedForm>(currentOwner, newOwner),
              (error) => {
                logger.error({
                  message: 'Error occurred whilst transferring form ownership',
                  meta: logMeta,
                  error,
                })

                return new DatabaseError(getMongoErrorMessage(error))
              },
            ),
          ),
      )
      // Step 4: Populate updated form.
      .andThen((updatedForm) =>
        ResultAsync.fromPromise(
          updatedForm
            .populate({ path: 'admin', populate: { path: 'agency' } })
            .execPopulate(),
          (error) => {
            logger.error({
              message: 'Error occurred whilst populating form with admin',
              meta: logMeta,
              error,
            })

            return new DatabaseError(getMongoErrorMessage(error))
          },
        ),
      )
  )
}

/**
 * Creates a form with the given form params
 * @param formParams parameters for the form to be created.
 *
 * @returns ok(created form) on success
 * @returns err(Database*Error) on database errors
 */
export const createForm = (
  formParams: Merge<IForm, { admin: string }>,
): ResultAsync<
  IFormSchema,
  | DatabaseError
  | DatabaseValidationError
  | DatabaseConflictError
  | DatabasePayloadSizeError
> => {
  return ResultAsync.fromPromise(FormModel.create(formParams), (error) => {
    logger.error({
      message: 'Database error encountered when creating form',
      meta: {
        action: 'createForm',
        formParams,
      },
      error,
    })

    return transformMongoError(error)
  })
}

/**
 * Duplicates given formId and replace owner with newAdminId.
 * @param originalForm the form to be duplicated
 * @param newAdminId the id of the admin of the duplicated form
 * @param overrideParams params to override in the duplicated form; e.g. the new emails or public key of the form.
 * @returns the newly created duplicated form
 */
export const duplicateForm = (
  originalForm: IFormDocument,
  newAdminId: string,
  overrideParams: DuplicateFormBody,
): ResultAsync<IFormDocument, FormNotFoundError | DatabaseError> => {
  const overrideProps = processDuplicateOverrideProps(
    overrideParams,
    newAdminId,
  )

  // Set startPage.logo to default irregardless.
  overrideProps.startPage = {
    ...originalForm.startPage,
    logo: { state: FormLogoState.Default },
  }
  // Prevent buttonLink from being copied over if buttonLink is the default
  // form hash.
  if (originalForm.endPage?.buttonLink === `#!/${originalForm._id}`) {
    overrideProps.endPage = omit(originalForm.endPage, 'buttonLink')
  }

  const duplicateParams = originalForm.getDuplicateParams(overrideProps)

  return ResultAsync.fromPromise(
    FormModel.create(duplicateParams) as Promise<IFormDocument>,
    (error) => {
      logger.error({
        message: 'Error encountered while duplicating form',
        meta: {
          action: 'duplicateForm',
          duplicateParams,
          newAdminId,
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}
