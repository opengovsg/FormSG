import JoiDate from '@joi/date'
import { celebrate, Joi as BaseJoi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import {
  AnalyticsEventInput,
  AnalyticsEventType,
  BasicField,
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
const Joi = BaseJoi.extend(JoiDate) as typeof BaseJoi

const dashboardVersion = Joi.string().valid('v1', 'v2')
const downloadVersion = Joi.string().valid('v1', 'v2')
const downloadFormats = Joi.array()
  .items(Joi.string().valid('csv', 'attachments', 'pdf'))
  .min(1)
  .unique()
const objectId = Joi.string().hex().length(24)
const columnId = Joi.string().max(100)
const isoDay = Joi.date().format('YYYY-MM-DD').raw()

const joiEvent = (types: AnalyticsEventType[], content: BaseJoi.ObjectSchema) =>
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
      formats: downloadFormats.required(),
      scope: Joi.string().valid('bulk', 'single').required(),
      savedViewId: objectId.optional(),
      isSavedViewModified: Joi.boolean().optional(),
      responsesCount: Joi.number().integer().min(0).optional(),
      dateRange: Joi.object({
        startDate: isoDay.required(),
        endDate: isoDay.required(),
      }).optional(),
      columnFilters: Joi.array()
        .items(
          Joi.object({
            columnId: columnId.required(),
            type: Joi.string().valid('text', 'values').required(),
          }),
        )
        .max(100)
        .optional(),
      downloadVersion: downloadVersion.optional(),
      folderNameFieldType: Joi.string()
        .valid(...Object.values(BasicField))
        .optional(),
    }),
  ),
  joiEvent(
    [AnalyticsEventType.ResultsDownloadFinished],
    Joi.object({
      downloadVersion: downloadVersion.required(),
      formats: downloadFormats.required(),
      outcome: Joi.string()
        .valid('success', 'partial', 'failed', 'cancelled')
        .required(),
      durationMs: Joi.number().min(0).required(),
      expectedCount: Joi.number().integer().min(0).optional(),
      successCount: Joi.number().integer().min(0).optional(),
      errorCount: Joi.number().integer().min(0).optional(),
      failedDownloadCount: Joi.number().integer().min(0).optional(),
      zipBytes: Joi.number().integer().min(0).optional(),
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
  joiEvent(
    [AnalyticsEventType.ResultsFilterApplied],
    Joi.object({
      filter: Joi.string().valid('date_range', 'column').required(),
      columnId: columnId.when('filter', {
        is: 'column',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    }),
  ),
  joiEvent(
    [AnalyticsEventType.ResultsSortApplied],
    Joi.object({
      direction: Joi.string().valid('asc', 'desc').required(),
      columnId: columnId.required(),
    }),
  ),
  joiEvent(
    [AnalyticsEventType.ResultsColumnToggled],
    Joi.object({
      visible: Joi.boolean().required(),
      columnId: columnId.required(),
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
