import { Router } from 'express'

import * as AnalyticsController from './analytics.controller'

export const AnalyticsRouter = Router()

/**
 * Retrieves the total number of users, forms and submissions of forms across the application.
 * @route GET /analytics/statistics
 * @group analytics - FormSG usage statistics
 * @returns 200
 */
AnalyticsRouter.get('/statistics', AnalyticsController.handleGetStatistics)
