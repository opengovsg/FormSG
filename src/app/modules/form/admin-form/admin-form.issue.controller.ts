import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'

import {
  ErrorDto,
  FormIssueMetaDto,
  FormIssueMetaQueryDto,
} from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import * as IssueService from '../../issue/issue.service'
import * as UserService from '../../user/user.service'

import { PermissionLevel } from './admin-form.types'
import { mapRouteError } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /{formId}/issue.
 * @security session
 *
 * @returns 200 with issue response
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleGetFormIssue: ControllerHandler<
  { formId: string },
  FormIssueMetaDto | ErrorDto,
  unknown,
  FormIssueMetaQueryDto
> = (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }),
    )
    .andThen(() => IssueService.getFormIssues(formId))
    .map((response) => res.json(response))
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving form issues',
        meta: {
          action: 'getFormIssue',
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
 * Handler for GET /{formId}/issue/download.
 * @security session
 *
 * @returns 200 with issue stream
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database or stream error occurs
 */
export const handleStreamFormIssue: ControllerHandler<
  { formId: string },
  FormIssueMetaDto | ErrorDto
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  const logMeta = {
    action: 'handleStreamFormIssue',
    ...createReqMeta(req),
    userId: sessionUserId,
    formId,
  }
  // Step 1: Retrieve currently logged-in user.
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
  const cursor = IssueService.getFormIssueStream(formId)

  cursor
    .on('error', (error) => {
      logger.error({
        message: 'Error streaming issue from MongoDB',
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
        message: 'Error converting issue to JSON',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error converting issue to JSON.',
      })
    })
    .pipe(res.type('json'))
    .on('error', (error) => {
      logger.error({
        message: 'Error writing issue to HTTP stream',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error writing issue to HTTP stream.',
      })
    })
    .on('close', () => {
      logger.info({
        message: 'Stream issue closed',
        meta: logMeta,
      })

      return res.end()
    })
}
