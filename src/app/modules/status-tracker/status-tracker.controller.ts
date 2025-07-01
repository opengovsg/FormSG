import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { okAsync } from 'neverthrow'
import { StatusTrackerData } from 'shared/types'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { getMultirespondentSubmission } from '../submission/multirespondent-submission/multirespondent-submission.service'
import { mapRouteError } from '../submission/submission.utils'

const logger = createLoggerWithLabel(module)

const validateGetStatusTrackerParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    submissionId: Joi.string().required(),
  }),
})

const getStatusTrackerSubmissionData: ControllerHandler<
  { submissionId: string },
  StatusTrackerData | { message: string },
  undefined // no req.body
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
      const statusTrackerData: StatusTrackerData = {
        submittedSteps: submissionData.submittedSteps,
        workflow: submissionData.workflow,
        responseId: submissionData.id,
        form: submissionData.form,
      }

      // Return relevant data in response
      res.status(StatusCodes.OK).json(statusTrackerData)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Failed to get status tracker submission data',
        meta: { ...logMeta, error: error },
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({
        message: errorMessage,
      })
    })
}

export const handleGetStatusTracker = [
  validateGetStatusTrackerParams,
  getStatusTrackerSubmissionData,
] as ControllerHandler[]
