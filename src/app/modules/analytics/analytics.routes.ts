import { Router } from 'express'

import * as CoreController from '../../controllers/core.server.controller'
import AggregateStatsFactory from '../../factories/aggregate-stats.factory'

export const AnalyticsRouter = Router()

/**
 * Retrieves the number of popular forms on the application
 * @route GET /analytics/forms
 * @group analytics - form usage statistics
 * @returns 200 with the number of forms with more than 10 submissions
 */
AnalyticsRouter.get('/forms', AggregateStatsFactory.formCount)

/**
 * Retrieves the number of users building forms on the application.
 * @route GET /analytics/users
 * @group analytics - form usage statistics
 * @returns 200 with the number of users building forms
 */
AnalyticsRouter.get('/users', CoreController.userCount)

/**
 * Retrieves the total number of submissions of forms across the application.
 * @route GET /analytics/submissions
 * @group analytics - form usage statistics
 * @returns 200 with the total number of submissions of forms
 */
AnalyticsRouter.get('/submissions', CoreController.submissionCount)
