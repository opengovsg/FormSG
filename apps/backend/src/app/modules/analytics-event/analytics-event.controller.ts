import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import {
  AnalyticsEventInput,
  AnalyticsEventType,
  ErrorDto,
} from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import * as AuthService from '../auth/auth.service'
import { ControllerHandler } from '../core/core.types'
import { PermissionLevel } from '../form/admin-form/admin-form.types'
import { mapRouteError } from '../form/admin-form/admin-form.utils'
import * as UserService from '../user/user.service'

import * as AnalyticsEventService from './analytics-event.service'

const logger = createLoggerWithLabel(module)

const dashboardVersion = Joi.string().valid('v1', 'v2')
const objectId = Joi.string().hex().length(24)

const joiEvent = (types: AnalyticsEventType[], content: Joi.ObjectSchema) =>
  Joi.object({
    type: Joi.string()
      .valid(...types)
      .required(),
    content: content.required(),
  })

const joiAnalyticsEventBody = Joi.alternatives().try(
  joiEvent(
    [AnalyticsEventType.ResultsDownload],
    Joi.object({
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
  ),
  joiEvent(
    [
      AnalyticsEventType.ResultsSavedViewCreated,
      AnalyticsEventType.ResultsSavedViewUpdated,
      AnalyticsEventType.ResultsSavedViewApplied,
    ],
    Joi.object({ savedViewId: objectId.required() }),
  ),
  joiEvent(
    [AnalyticsEventType.ResultsVersionToggled],
    Joi.object({
      from: dashboardVersion.required(),
      to: dashboardVersion.required(),
    }),
  ),
)

export const _handleCreateAnalyticsEvent: ControllerHandler<
  { formId: string },
  ErrorDto | void,
  AnalyticsEventInput
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
      AnalyticsEventService.createAnalyticsEvent({
        form,
        adminId: sessionUserId,
        event: req.body,
      }),
    )
    .map(() => res.sendStatus(StatusCodes.NO_CONTENT))
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred when creating analytics event',
        meta: {
          action: 'handleCreateAnalyticsEvent',
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
 * Handler for POST /forms/:formId/analytics-events
 */
export const handleCreateAnalyticsEvent = [
  celebrate({
    [Segments.BODY]: joiAnalyticsEventBody,
  }),
  _handleCreateAnalyticsEvent,
] as ControllerHandler[]
