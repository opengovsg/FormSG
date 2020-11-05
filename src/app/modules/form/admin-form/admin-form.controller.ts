import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { getUserIdFromSession } from '../../auth/auth.utils'
import * as SubmissionService from '../../submission/submission.service'
import * as UserService from '../../user/user.service'
import * as FormService from '../form.service'

import {
  createPresignedPostForImages,
  createPresignedPostForLogos,
  getDashboardForms,
} from './admin-form.service'
import { assertHasReadPermissions, mapRouteError } from './admin-form.utils'

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

  // Step 1: Check whether user is logged in.
  const sessionUserId = getUserIdFromSession(req.session)

  if (!sessionUserId) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'User is unauthorized.' })
  }

  // Step 2: Retrieve currently logged in user.
  const adminResult = await UserService.getPopulatedUserById(sessionUserId)
  // Step 2a: Error retrieving logged in user.
  if (adminResult.isErr()) {
    logger.error({
      message: 'Error occurred whilst retrieving user',
      meta: {
        action: 'handleCountFormSubmissions',
        userId: sessionUserId,
      },
      error: adminResult.error,
    })

    const { errorMessage, statusCode } = mapRouteError(adminResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  // Step 2b: Successfully retrieved logged in user.
  const admin = adminResult.value

  // Step 3: Retrieve full form.
  const formResult = await FormService.retrieveFullFormById(formId)
  // Step 3a: Error retrieving form.
  if (formResult.isErr()) {
    logger.error({
      message: 'Failed to retrieve form',
      meta: {
        action: 'handleCountFormSubmissions',
        ...createReqMeta(req),
        formId,
      },
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  // Step 3b: Successfully retrieved form.
  const form = formResult.value

  // Step 4: Check form permissions.
  const permissionResult = assertHasReadPermissions(admin, form)
  // Step 4a: Read permission error.
  if (permissionResult.isErr()) {
    logger.error({
      message: 'User does not have read permissions',
      meta: {
        action: 'handleCountFormSubmissions',
        ...createReqMeta(req),
        userId: sessionUserId,
        formId,
      },
      error: permissionResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(permissionResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Step 5: has permissions, continue to retrieve submission counts.
  const countResult = await SubmissionService.getFormSubmissionsCount(
    form._id,
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
