import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import {
  ErrorDto,
  ResultsEventInput,
  ResultsEventType,
} from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import * as AuthService from '../auth/auth.service'
import { ControllerHandler } from '../core/core.types'
import { PermissionLevel } from '../form/admin-form/admin-form.types'
import { mapRouteError } from '../form/admin-form/admin-form.utils'
import * as UserService from '../user/user.service'

import * as ResultsEventService from './results-event.service'

const logger = createLoggerWithLabel(module)

const dashboardVersion = Joi.string().valid('v1', 'v2')
const objectId = Joi.string().hex().length(24)

const joiResultsEventBody = Joi.alternatives().try(
  Joi.object({
    type: Joi.string().valid(ResultsEventType.Download).required(),
    dashboardVersion: dashboardVersion.required(),
    formats: Joi.array()
      .items(Joi.string().valid('csv', 'attachments', 'pdf'))
      .min(1)
      .unique()
      .required(),
    scope: Joi.string().valid('bulk', 'single').required(),
    savedViewId: objectId.optional(),
    isSavedViewModified: Joi.boolean().optional(),
    responsesCount: Joi.number().integer().min(0).optional(),
  }),
  Joi.object({
    type: Joi.string()
      .valid(
        ResultsEventType.SavedViewCreated,
        ResultsEventType.SavedViewUpdated,
        ResultsEventType.SavedViewApplied,
      )
      .required(),
    savedViewId: objectId.required(),
  }),
  Joi.object({
    type: Joi.string().valid(ResultsEventType.VersionToggled).required(),
    from: dashboardVersion.required(),
    to: dashboardVersion.required(),
  }),
)

export const _handleCreateResultsEvent: ControllerHandler<
  { formId: string },
  ErrorDto | void,
  ResultsEventInput
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
    .andThen((form) =>
      ResultsEventService.createResultsEvent({
        form,
        adminId: sessionUserId,
        event: req.body,
      }),
    )
    .map(() => res.sendStatus(StatusCodes.NO_CONTENT))
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred when creating results event',
        meta: {
          action: 'handleCreateResultsEvent',
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
 * Handler for POST /forms/:formId/results-events
 */
export const handleCreateResultsEvent = [
  celebrate({
    [Segments.BODY]: joiResultsEventBody,
  }),
  _handleCreateResultsEvent,
] as ControllerHandler[]
