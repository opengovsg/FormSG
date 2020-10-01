import { Router } from 'express'

import * as AnalyticsController from './analytics.controller'

export const AnalyticsRouter = Router()

/**
 * Retrieves the number of popular forms on the application
 * @route GET /analytics/forms
 * @group analytics - form usage statistics
 * @returns 200 with the number of forms with more than 10 submissions
 */
AnalyticsRouter.get('/forms', AnalyticsController.handleGetFormCountAnalytics)

/**
 * Retrieves the number of users building forms on the application.
 * @route GET /analytics/users
 * @group analytics - form usage statistics
 * @returns 200 with the number of users building forms
 * @returns 500 when database error occurs whilst retrieving user count
 */
AnalyticsRouter.get('/users', AnalyticsController.handleGetUserAnalytics)

/**
 * Retrieves the total number of submissions of forms across the application.
 * @route GET /analytics/submissions
 * @group analytics - form usage statistics
 * @returns 200 with the total number of submissions of forms
 */
AnalyticsRouter.get(
  '/submissions',
  AnalyticsController.handleGetSubmissionsAnalytics,
)
