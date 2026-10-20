import { Router } from 'express'

import { rateLimitConfig } from '../../../../../config/config'
import * as ResultsEventController from '../../../../../modules/results-event/results-event.controller'
import { limitRate } from '../../../../../utils/limit-rate'

export const AdminFormsResultsEventsRouter = Router()

/**
 * Records a results page event (download, saved view use, dashboard version
 * toggle) for product analytics.
 * @route POST /admin/forms/:formId/results-events
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
AdminFormsResultsEventsRouter.post(
  '/:formId([a-fA-F0-9]{24})/results-events',
  limitRate({ max: rateLimitConfig.resultsEvents }),
  ResultsEventController.handleCreateResultsEvent,
)
