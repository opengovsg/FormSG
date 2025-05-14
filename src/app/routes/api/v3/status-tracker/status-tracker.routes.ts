import { Router } from 'express'

export const StatusTrackerRouter = Router()

/**
 * Checks if status tracker for mrf submission exists
 * @route GET /:formId/status/:submissionId
 *
 * @returns 200 if submission URL exists
 * @returns 404 if submission URL does not exist or submission does not exist
 */
StatusTrackerRouter.get(
  '/:formId([a-fA-F0-9]{24})/status/:submissionId([a-fA-F0-9]{24})',
  StatusTrackerController.getStatusForSubmission,
)
