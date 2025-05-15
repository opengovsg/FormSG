import { Router } from 'express'

import * as StatusTrackerController from '../../../../modules/status-tracker/status-tracker.controller'

export const StatusTrackerRouter = Router()

/**
 * Checks if status tracker for mrf submission exists
 * @route GET /status/:submissionId
 *
 * @returns 200 if submission URL exists
 * @returns 404 if submission URL does not exist or submission does not exist
 */
StatusTrackerRouter.get(
  '/:submissionId([a-fA-F0-9]{24})',
  StatusTrackerController.handleGetStatusTracker,
)
