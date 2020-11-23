import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import { createLoggerWithLabel } from '../../../../config/logger'
import { AuthType, WithForm } from '../../../../types'
import { createReqMeta } from '../../../utils/request'
import * as FeedbackService from '../../feedback/feedback.service'
import * as SubmissionService from '../../submission/submission.service'
import * as UserService from '../../user/user.service'
import * as FormService from '../form.service'

import {
  createPresignedPostForImages,
  createPresignedPostForLogos,
  getDashboardForms,
  getMockSpcpLocals,
} from './admin-form.service'
import {
  assertFormAvailable,
  assertHasReadPermissions,
  mapRouteError,
} from './admin-form.utils'

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
 * Handler for POST /:formId([a-fA-F0-9]{24})/adminform/images.
 * @security session
 *
 * @returns 200 with presigned POST object
 * @returns 400 when error occurs whilst creating presigned POST object
 */
export const handleCreatePresignedPostForImages: RequestHandler<
  ParamsDictionary,
  unknown,
  {
    fileId: string
    fileMd5Hash: string
    fileType: string
  }
> = async (req, res) => {
  const { fileId, fileMd5Hash, fileType } = req.body

  return createPresignedPostForImages({ fileId, fileMd5Hash, fileType })
    .map((presignedPost) => res.json(presignedPost))
    .mapErr((error) => {
      logger.error({
        message: 'Presigning post data encountered an error',
        meta: {
          action: 'handleCreatePresignedPostForImages',
          ...createReqMeta(req),
        },
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handler for POST /:formId([a-fA-F0-9]{24})/adminform/logos.
 * @security session
 *
 * @returns 200 with presigned POST object
 * @returns 400 when error occurs whilst creating presigned POST object
 */
export const handleCreatePresignedPostForLogos: RequestHandler<
  ParamsDictionary,
  unknown,
  {
    fileId: string
    fileMd5Hash: string
    fileType: string
  }
> = async (req, res) => {
  const { fileId, fileMd5Hash, fileType } = req.body

  return createPresignedPostForLogos({ fileId, fileMd5Hash, fileType })
    .map((presignedPost) => res.json(presignedPost))
    .mapErr((error) => {
      logger.error({
        message: 'Presigning post data encountered an error',
        meta: {
          action: 'handleCreatePresignedPostForLogos',
          ...createReqMeta(req),
        },
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
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
  const adminResult = await UserService.getPopulatedUserById(sessionUserId)
  // Step 1a: Error retrieving logged in user.
  if (adminResult.isErr()) {
    logger.error({
      message: 'Error occurred whilst retrieving user',
      meta: logMeta,
      error: adminResult.error,
    })

    const { errorMessage, statusCode } = mapRouteError(adminResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  // Step 1b: Successfully retrieved logged in user.
  const admin = adminResult.value

  // Step 2: Retrieve full form.
  const formResult = await FormService.retrieveFullFormById(formId)
  // Step 2a: Error retrieving form.
  if (formResult.isErr()) {
    logger.error({
      message: 'Failed to retrieve form',
      meta: logMeta,
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  // Step 2b: Successfully retrieved form.
  const form = formResult.value

  // Step 3: Check whether form is already archived.
  const availableResult = assertFormAvailable(form)
  // Step 3a: Form is already archived.
  if (availableResult.isErr()) {
    logger.warn({
      message: 'User attempted to retrieve archived form',
      meta: logMeta,
      error: availableResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(availableResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Step 4: Form is still available for retrieval, check form permissions.
  const permissionResult = assertHasReadPermissions(admin, form)
  // Step 4a: Read permission error.
  if (permissionResult.isErr()) {
    logger.warn({
      message: 'User does not have read permissions',
      meta: logMeta,
      error: permissionResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(permissionResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Step 5: Has permissions, continue to retrieve submission counts.
  const countResult = await SubmissionService.getFormSubmissionsCount(
    String(form._id),
    { startDate, endDate },
  )
  // Step 5a: Error retrieving form submissions counts.
  if (countResult.isErr()) {
    logger.error({
      message: 'Error retrieving form submission count',
      meta: {
        action: 'handleCountFormSubmissions',
        ...createReqMeta(req),
        userId: sessionUserId,
        formId,
      },
      error: countResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(countResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Successfully retrieved count.
  return res.json(countResult.value)
}

/**
 * Allow submission in preview without Spcp authentication by providing default values
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - the next expressjs callback
 */
export const passThroughSpcp: RequestHandler = (req, res, next) => {
  const { authType } = (req as WithForm<typeof req>).form
  if (authType === AuthType.SP || authType === AuthType.CP) {
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
        // Step 2: Retrieve full form.
        FormService.retrieveFullFormById(formId).andThen((fullForm) =>
          // Step 3: Check whether form is active.
          assertFormAvailable(fullForm).andThen(() =>
            // Step 4: Check whether current user has read permissions to form.
            assertHasReadPermissions(user, fullForm),
          ),
        ),
      )
      // Step 5: Retrieve form feedback counts.
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
