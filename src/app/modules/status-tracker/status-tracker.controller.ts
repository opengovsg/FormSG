import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { okAsync } from 'neverthrow'
import { StatusTrackerData } from 'shared/types'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { DatabaseError } from '../core/core.errors'
import { ControllerHandler } from '../core/core.types'
import { getMultirespondentSubmission } from '../submission/multirespondent-submission/multirespondent-submission.service'
import { SubmissionNotFoundError } from '../submission/submission.errors'

const logger = createLoggerWithLabel(module)

// TODO: check if this is needed since we are passing variables as params not in body
const validateGetStatusTrackerParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    submissionId: Joi.string().required(),
  }),
})

const getStatusTrackerSubmissionData: ControllerHandler<
  { submissionId: string },
  StatusTrackerData,
  string // what is the req.body?
> = async (req, res) => {
  const { submissionId } = req.params
  const logMeta = {
    action: 'getStatusTrackerSubmissionData',
    ...createReqMeta(req),
    submissionId,
  }

  return okAsync(submissionId)
    .andThen((submissionId) => getMultirespondentSubmission(submissionId))
    .map((submissionData) => {
      logger.info({
        message: `Testing BE API: ${submissionData}`,
        meta: logMeta,
      })

      const statusTrackerData: StatusTrackerData = {
        submittedSteps: submissionData.submittedSteps,
        workflow: submissionData.workflow,
      }

      // Return relevant data in response
      res.status(StatusCodes.OK).json(statusTrackerData)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Failed to get status tracker submission data',
        meta: { ...logMeta, error: error },
      })

      // Return error in response
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
    })
}

export const handleGetStatusTracker = [
  validateGetStatusTrackerParams,
  getStatusTrackerSubmissionData,
] as ControllerHandler[]
