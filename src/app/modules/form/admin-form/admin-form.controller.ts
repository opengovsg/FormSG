import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../../config/logger'
import { ErrorDto } from '../../../../shared/typings/core'
import { SettingsUpdateDto } from '../../../../shared/typings/form'
import {
  AuthType,
  FormSettings,
  IForm,
  IPopulatedForm,
  WithForm,
} from '../../../../types'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from '../../core/core.errors'
import * as FeedbackService from '../../feedback/feedback.service'
import * as SubmissionService from '../../submission/submission.service'
import * as UserService from '../../user/user.service'
import { PrivateFormError } from '../form.errors'

import { EditFieldError } from './admin-form.errors'
import {
  archiveForm,
  createForm,
  createPresignedPostUrlForImages,
  createPresignedPostUrlForLogos,
  duplicateForm,
  editFormFields,
  getDashboardForms,
  getMockSpcpLocals,
  transferFormOwnership,
  updateForm,
  updateFormSettings,
} from './admin-form.service'
import {
  DuplicateFormBody,
  FormUpdateParams,
  PermissionLevel,
} from './admin-form.types'
import { mapRouteError } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /adminform endpoint.
 * @security session
 *
 * @returns 200 with list of forms user can access when list is retrieved successfully
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database errors occur
 */
export const handleListDashboardForms: RequestHandler = async (req, res) => {
  const authedUserId = (req.session as Express.AuthedSession).user._id
  const dashboardResult = await getDashboardForms(authedUserId)

  if (dashboardResult.isErr()) {
    const { error } = dashboardResult
    logger.error({
      message: 'Error listing dashboard forms',
      meta: {
        action: 'handleListDashboardForms',
        userId: authedUserId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Success.
  return res.json(dashboardResult.value)
}

/**
 * Handler for GET /:formId/adminform.
 * @security session
 *
 * @returns 200 with retrieved form with formId if user has read permissions
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleGetAdminForm: RequestHandler<{ formId: string }> = (
  req,
  res,
) => {
  const { formId } = req.params
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has read permissions to form
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      .map((form) => res.status(StatusCodes.OK).json({ form }))
      .mapErr((error) => {
        logger.error({
          message: 'Error retrieving single form',
          meta: {
            action: 'handleGetSingleForm',
            ...createReqMeta(req),
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for GET /:formId/adminform/preview.
 * @security session
 *
 * @returns 200 with form with private details scrubbed for previewing if user has read permissions
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handlePreviewAdminForm: RequestHandler<{ formId: string }> = (
  req,
  res,
) => {
  const { formId } = req.params
  const sessionUserId = (req.session as Express.AuthedSession).user._id
  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has read permissions to form
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      // Step 3: Remove private details from form for previewing.
      .map((populatedForm) => populatedForm.getPublicView())
      .map((scrubbedForm) =>
        res.status(StatusCodes.OK).json({ form: scrubbedForm }),
      )
      .mapErr((error) => {
        logger.error({
          message: 'Error previewing admin form',
          meta: {
            action: 'handlePreviewAdminForm',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for POST /:formId([a-fA-F0-9]{24})/adminform/images.
 * @security session
 *
 * @returns 200 with presigned POST URL object
 * @returns 400 when error occurs whilst creating presigned POST URL object
 * @returns 403 when user does not have write permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 */
export const handleCreatePresignedPostUrlForImages: RequestHandler<
  { formId: string },
  unknown,
  {
    fileId: string
    fileMd5Hash: string
    fileType: string
  }
> = async (req, res) => {
  const { formId } = req.params
  const { fileId, fileMd5Hash, fileType } = req.body
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has write permissions to form
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }),
      )
      // Step 3: Has write permissions, generate presigned POST URL.
      .andThen(() =>
        createPresignedPostUrlForImages({ fileId, fileMd5Hash, fileType }),
      )
      .map((presignedPostUrl) => res.json(presignedPostUrl))
      .mapErr((error) => {
        logger.error({
          message: 'Presigning post data encountered an error',
          meta: {
            action: 'handleCreatePresignedPostUrlForImages',
            ...createReqMeta(req),
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for POST /:formId([a-fA-F0-9]{24})/adminform/logos.
 * @security session
 *
 * @returns 200 with presigned POST URL object
 * @returns 400 when error occurs whilst creating presigned POST URL object
 * @returns 403 when user does not have write permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 */
export const handleCreatePresignedPostUrlForLogos: RequestHandler<
  ParamsDictionary,
  unknown,
  {
    fileId: string
    fileMd5Hash: string
    fileType: string
  }
> = async (req, res) => {
  const { formId } = req.params
  const { fileId, fileMd5Hash, fileType } = req.body
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has write permissions to form
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }),
      )
      // Step 3: Has write permissions, generate presigned POST URL.
      .andThen(() =>
        createPresignedPostUrlForLogos({ fileId, fileMd5Hash, fileType }),
      )
      .map((presignedPostUrl) => res.json(presignedPostUrl))
      .mapErr((error) => {
        logger.error({
          message: 'Presigning post data encountered an error',
          meta: {
            action: 'handleCreatePresignedPostUrlForLogos',
            ...createReqMeta(req),
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for GET /{formId}/adminform/submissions/count.
 * @security session
 *
 * @returns 200 with submission counts of given form
 * @returns 400 when query.startDate or query.endDate is malformed
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleCountFormSubmissions: RequestHandler<
  { formId: string },
  unknown,
  unknown,
  { startDate?: string; endDate?: string }
> = async (req, res) => {
  const { formId } = req.params
  const { startDate, endDate } = req.query
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  const logMeta = {
    action: 'handleCountFormSubmissions',
    ...createReqMeta(req),
    userId: sessionUserId,
    formId,
  }

  // Step 1: Retrieve currently logged in user.
  const formResult = await UserService.getPopulatedUserById(
    sessionUserId,
  ).andThen((user) =>
    // Step 2: Check whether user has read permissions to form
    AuthService.getFormAfterPermissionChecks({
      user,
      formId,
      level: PermissionLevel.Read,
    }),
  )

  if (formResult.isErr()) {
    logger.warn({
      message: 'Error occurred when checking user permissions for form',
      meta: logMeta,
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Step 3: Has permissions, continue to retrieve submission counts.
  return SubmissionService.getFormSubmissionsCount(formId, {
    startDate,
    endDate,
  })
    .map((count) => res.json(count))
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving form submission count',
        meta: {
          action: 'handleCountFormSubmissions',
          ...createReqMeta(req),
          userId: sessionUserId,
          formId,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Allow submission in preview without Spcp authentication by providing default values
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - the next expressjs callback
 */
export const passThroughSpcp: RequestHandler = (req, res, next) => {
  const { authType } = (req as WithForm<typeof req>).form
  if ([AuthType.SP, AuthType.CP, AuthType.MyInfo].includes(authType)) {
    res.locals = {
      ...res.locals,
      ...getMockSpcpLocals(
        authType,
        (req as WithForm<typeof req>).form.form_fields,
      ),
    }
  }
  return next()
}

/**
 * Handler for GET /{formId}/adminform/feedback/count.
 * @security session
 *
 * @returns 200 with feedback counts of given form
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleCountFormFeedback: RequestHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has read permissions to form
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      // Step 3: Retrieve form feedback counts.
      .andThen(() => FeedbackService.getFormFeedbackCount(formId))
      .map((feedbackCount) => res.json(feedbackCount))
      // Some error occurred earlier in the chain.
      .mapErr((error) => {
        logger.error({
          message: 'Error retrieving form feedback count',
          meta: {
            action: 'handleCountFormFeedback',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for GET /{formId}/adminform/feedback/download.
 * @security session
 *
 * @returns 200 with feedback stream
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database or stream error occurs
 */
export const handleStreamFormFeedback: RequestHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  // Step 1: Retrieve currently logged in user.
  const hasReadPermissionResult = await UserService.getPopulatedUserById(
    sessionUserId,
  ).andThen((user) =>
    // Step 2: Check whether user has read permissions to form
    AuthService.getFormAfterPermissionChecks({
      user,
      formId,
      level: PermissionLevel.Read,
    }),
  )

  const logMeta = {
    action: 'handleStreamFormFeedback',
    ...createReqMeta(req),
    userId: sessionUserId,
    formId,
  }

  if (hasReadPermissionResult.isErr()) {
    logger.error({
      message: 'Error occurred whilst verifying user permissions',
      meta: logMeta,
      error: hasReadPermissionResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(
      hasReadPermissionResult.error,
    )
    return res.status(statusCode).json({ message: errorMessage })
  }

  // No errors, start stream.
  const cursor = FeedbackService.getFormFeedbackStream(formId)

  cursor
    .on('error', (error) => {
      logger.error({
        message: 'Error streaming feedback from MongoDB',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving from database.',
      })
    })
    .pipe(JSONStream.stringify())
    .on('error', (error) => {
      logger.error({
        message: 'Error converting feedback to JSON',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error converting feedback to JSON',
      })
    })
    .pipe(res.type('json'))
    .on('error', (error) => {
      logger.error({
        message: 'Error writing feedback to HTTP stream',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error writing feedback to HTTP stream',
      })
    })
    .on('close', () => {
      logger.info({
        message: 'Stream feedback closed',
        meta: logMeta,
      })

      return res.end()
    })
}

/**
 * Handler for GET /{formId}/adminform/feedback.
 * @security session
 *
 * @returns 200 with feedback response
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleGetFormFeedbacks: RequestHandler<{
  formId: string
}> = (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }),
    )
    .andThen(() => FeedbackService.getFormFeedbacks(formId))
    .map((fbResponse) => res.json(fbResponse))
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving form feedbacks',
        meta: {
          action: 'handleGetFormFeedbacks',
          ...createReqMeta(req),
          userId: sessionUserId,
          formId,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handler for DELETE /{formId}/adminform.
 * @security session
 *
 * @returns 200 with success message when successfully archived
 * @returns 403 when user does not have permissions to archive form
 * @returns 404 when form cannot be found
 * @returns 410 when form is already archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleArchiveForm: RequestHandler<{ formId: string }> = async (
  req,
  res,
) => {
  const { formId } = req.params
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has delete permissions for form.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Delete,
        }),
      )
      // Step 3: Currently logged in user has permissions to archive form.
      .andThen((formToArchive) => archiveForm(formToArchive))
      .map(() => res.json({ message: 'Form has been archived' }))
      .mapErr((error) => {
        logger.warn({
          message: 'Error occurred when archiving form',
          meta: {
            action: 'handleArchiveForm',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for POST /:formId/adminform
 * Duplicates the form corresponding to the formId. The currently logged in user
 * must have read permissions to the form being copied.
 * @note Even if current user is not admin of the form, the current user will be the admin of the new form
 * @security session
 *
 * @returns 200 with the duplicate form dashboard view
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleDuplicateAdminForm: RequestHandler<
  { formId: string },
  unknown,
  DuplicateFormBody
> = (req, res) => {
  const { formId } = req.params
  const userId = (req.session as Express.AuthedSession).user._id
  const overrideParams = req.body

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(userId)
      .andThen((user) =>
        // Step 2: Check if current user has permissions to read form.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        })
          .andThen((originalForm) =>
            // Step 3: Duplicate form.
            duplicateForm(originalForm, userId, overrideParams),
          )
          // Step 4: Retrieve dashboard view of duplicated form.
          .map((duplicatedForm) => duplicatedForm.getDashboardView(user)),
      )
      // Success; return duplicated form's dashboard view.
      .map((dupedDashView) => res.json(dupedDashView))
      // Error; some error occurred in the chain.
      .mapErr((error) => {
        logger.error({
          message: 'Error duplicating form',
          meta: {
            action: 'handleDuplicateAdminForm',
            ...createReqMeta(req),
            userId,
            formId,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

export const handleGetTemplateForm: RequestHandler<{ formId: string }> = (
  req,
  res,
) => {
  const { formId } = req.params
  const userId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve form only if form is currently public.
    AuthService.getFormIfPublic(formId)
      // Step 2: Remove private form details before being returned.
      .map((populatedForm) => populatedForm.getPublicView())
      .map((scrubbedForm) =>
        res.status(StatusCodes.OK).json({ form: scrubbedForm }),
      )
      .mapErr((error) => {
        logger.error({
          message: 'Error retrieving form template',
          meta: {
            action: 'handleGetTemplateForm',
            ...createReqMeta(req),
            userId,
            formId,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)

        // Specialized error response for PrivateFormError.
        if (error instanceof PrivateFormError) {
          return res.status(statusCode).json({
            message: error.message,
            // Flag to prevent default 404 subtext ("please check link") from
            // showing.
            isPageFound: true,
            formTitle: error.formTitle,
          })
        }
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for POST /:formId/adminform/copy
 * Duplicates the form corresponding to the formId. The form must be public to
 * be copied.
 * @note The current user will be the admin of the new duplicated form
 * @security session
 *
 * @returns 200 with the duplicate form dashboard view
 * @returns 403 when form is private
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleCopyTemplateForm: RequestHandler<
  { formId: string },
  unknown,
  DuplicateFormBody
> = (req, res) => {
  const { formId } = req.params
  const userId = (req.session as Express.AuthedSession).user._id
  const overrideParams = req.body

  // TODO(#792): Remove when frontend has stopped sending isTemplate.
  if ('isTemplate' in req.body) {
    logger.info({
      message: 'isTemplate is still being sent by the frontend',
      meta: {
        action: 'handleCopyTemplateForm',
      },
    })
  }

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(userId)
      .andThen((user) =>
        // Step 2: Check if form is currently public.
        AuthService.getFormIfPublic(formId).andThen((originalForm) =>
          // Step 3: Duplicate form.
          duplicateForm(originalForm, userId, overrideParams)
            // Step 4: Retrieve dashboard view of duplicated form.
            .map((duplicatedForm) => duplicatedForm.getDashboardView(user)),
        ),
      )
      // Success; return duplicated form's dashboard view.
      .map((dupedDashView) => res.json(dupedDashView))
      // Error; some error occurred in the chain.
      .mapErr((error) => {
        logger.error({
          message: 'Error copying template form',
          meta: {
            action: 'handleCopyTemplateForm',
            ...createReqMeta(req),
            userId: userId,
            formId,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)

        // Specialized error response for PrivateFormError.
        if (error instanceof PrivateFormError) {
          return res.status(statusCode).json({
            message: 'Form must be public to be copied',
          })
        }
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for POST /{formId}/adminform/transfer-owner.
 * @security session
 *
 * @returns 200 with updated form with transferred owners
 * @returns 403 when user is not the current owner of the form
 * @returns 404 when form cannot be found
 * @returns 409 when new owner is not in the database yet, or if new owner is current owner
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleTransferFormOwnership: RequestHandler<
  { formId: string },
  unknown,
  { email: string }
> = (req, res) => {
  const { formId } = req.params
  const { email: newOwnerEmail } = req.body
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Retrieve form with delete permission check.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Delete,
        }),
      )
      // Step 3: User has permissions, transfer form ownership.
      .andThen((retrievedForm) =>
        transferFormOwnership(retrievedForm, newOwnerEmail),
      )
      // Success, return updated form.
      .map((updatedPopulatedForm) => res.json({ form: updatedPopulatedForm }))
      // Some error occurred earlier in the chain.
      .mapErr((error) => {
        logger.error({
          message: 'Error occurred whilst transferring form ownership',
          meta: {
            action: 'handleTransferFormOwnership',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
            newOwnerEmail,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for POST /adminform.
 * @security session
 *
 * @returns 200 with newly created form
 * @returns 409 when a database conflict error occurs
 * @returns 413 when payload for created form exceeds size limit
 * @returns 422 when user of given id cannnot be found in the database, or when form parameters are invalid
 * @returns 500 when database error occurs
 */
export const handleCreateForm: RequestHandler<
  ParamsDictionary,
  unknown,
  { form: Omit<IForm, 'admin'> }
> = async (req, res) => {
  const { form: formParams } = req.body
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  return (
    // Step 1: Retrieve currently logged in user.
    UserService.findUserById(sessionUserId)
      // Step 2: Create form with given params and set admin to logged in user.
      .andThen((user) => createForm({ ...formParams, admin: user._id }))
      .map((createdForm) => res.status(StatusCodes.OK).json(createdForm))
      .mapErr((error) => {
        logger.error({
          message: 'Error occurred when creating form',
          meta: {
            action: 'handleCreateForm',
            ...createReqMeta(req),
            userId: sessionUserId,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for PUT /:formId/adminform.
 * @security session
 *
 * @returns 200 with updated form
 * @returns 400 when form field has invalid updates to be performed
 * @returns 403 when current user does not have permissions to update form
 * @returns 404 when form to update cannot be found
 * @returns 409 when saving updated form incurs a conflict in the database
 * @returns 410 when form to update is archived
 * @returns 413 when updated form is too large to be saved in the database
 * @returns 422 when an invalid update is attempted on the form
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleUpdateForm: RequestHandler<
  { formId: string },
  unknown,
  { form: FormUpdateParams }
> = (req, res) => {
  const { formId } = req.params
  const { form: formUpdateParams } = req.body
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  // Step 1: Retrieve currently logged in user.
  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Retrieve form with write permission check.
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }),
    )
    .andThen((retrievedForm) => {
      // Step 3: Update form or form fields depending on form update parameters
      // passed in.
      const { editFormField } = formUpdateParams

      // Use different service function depending on type of form update.
      const updateFormResult: ResultAsync<
        IPopulatedForm,
        | EditFieldError
        | DatabaseError
        | DatabaseValidationError
        | DatabaseConflictError
        | DatabasePayloadSizeError
      > = editFormField
        ? editFormFields(retrievedForm, editFormField)
        : updateForm(retrievedForm, formUpdateParams)

      return updateFormResult
    })
    .map((updatedForm) => res.status(StatusCodes.OK).json(updatedForm))
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred when updating form',
        meta: {
          action: 'handleUpdateForm',
          ...createReqMeta(req),
          userId: sessionUserId,
          formId,
          formUpdateParams,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handler for PATCH /form/:formId/settings.
 * @security session
 *
 * @returns 200 with updated form settings
 * @returns 403 when current user does not have permissions to update form settings
 * @returns 404 when form to update settings for cannot be found
 * @returns 409 when saving form settings incurs a conflict in the database
 * @returns 410 when updating settings for archived form
 * @returns 413 when updating settings causes form to be too large to be saved in the database
 * @returns 422 when an invalid settings update is attempted on the form
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleUpdateSettings: RequestHandler<
  { formId: string },
  FormSettings | ErrorDto,
  SettingsUpdateDto
> = (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as Express.AuthedSession).user._id
  const settingsToPatch = req.body

  // Step 1: Retrieve currently logged in user.
  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Retrieve form with write permission check.
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }),
    )
    .andThen((retrievedForm) =>
      updateFormSettings(retrievedForm, settingsToPatch),
    )
    .map((updatedForm) => res.status(StatusCodes.OK).json(updatedForm))
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred when updating form settings',
        meta: {
          action: 'handleUpdateSettings',
          ...createReqMeta(req),
          userId: sessionUserId,
          formId,
          settingsKeysToUpdate: Object.keys(settingsToPatch),
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
