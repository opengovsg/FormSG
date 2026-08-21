import { AuthedSessionData } from 'express-session'
import {
  ErrorDto,
  FormIssueMetaDto,
  FormIssueMetaQueryDto,
} from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import * as IssueService from '../../issue/issue.service'
import * as UserService from '../../user/user.service'

import { adminFormErrorKey, buildAdminFormErrorDto } from './admin-form.i18n'
import { PermissionLevel } from './admin-form.types'
import { mapRouteError } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /{formId}/issues.
 * @security session
 *
 * @returns 200 with issue responses
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleGetFormIssues: ControllerHandler<
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
      const { errorMessage, statusCode, errorMessageKey } = mapRouteError(error)
      return res
        .status(statusCode)
        .json(buildAdminFormErrorDto(errorMessage, errorMessageKey))
    })
}

/**
 * Handler for GET /{formId}/issues/download.
 * @security session
 *
 * @returns 200 with issue stream
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database or stream error occurs
 */
export const handleStreamFormIssues: ControllerHandler<
  { formId: string },
  FormIssueMetaDto | ErrorDto
> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  const logMeta = {
    action: 'handleStreamFormIssues',
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
    const { errorMessage, statusCode, errorMessageKey } = mapRouteError(
      hasReadPermissionResult.error,
    )
    return res
      .status(statusCode)
      .json(buildAdminFormErrorDto(errorMessage, errorMessageKey))
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
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          buildAdminFormErrorDto(
            'Error retrieving from database.',
            adminFormErrorKey('exports.databaseRetrieval'),
          ),
        )
    })
    .pipe(JSONStream.stringify())
    .on('error', (error) => {
      logger.error({
        message: 'Error converting issue to JSON',
        meta: logMeta,
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          buildAdminFormErrorDto(
            'Error converting issue to JSON.',
            adminFormErrorKey('exports.issue.jsonConversion'),
          ),
        )
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
