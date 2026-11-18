import { Router } from 'express'

import { rateLimitConfig } from '../../../../../config/config'
import * as AnalyticsEventController from '../../../../../modules/analytics-event/analytics-event.controller'
import { limitRate } from '../../../../../utils/limit-rate'

export const AdminFormsAnalyticsEventsRouter = Router()

/**
 * Records a product analytics event on a form, such as a results page
 * download, saved view use, or dashboard version toggle.
 * @route POST /admin/forms/:formId/analytics-events
 * @group admin
 * @consumes application/json
 * @returns 204 when the event is recorded
 * @returns 400 when the body does not match any event shape
 * @returns 403 when user does not have read permissions to the form
 * @returns 404 when form cannot be found
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 429 when the rate limit is exceeded
 * @returns 500 when database error occurs
 */
AdminFormsAnalyticsEventsRouter.post(
  '/:formId([a-fA-F0-9]{24})/analytics-events',
  limitRate({ max: rateLimitConfig.analyticsEvents }),
  AnalyticsEventController.handleCreateAnalyticsEvent,
)
