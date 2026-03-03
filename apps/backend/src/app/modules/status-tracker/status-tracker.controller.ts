import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { okAsync } from 'neverthrow'

import {
  StatusTrackerData,
  StrippedFormWorkflowDto,
} from '../../../../shared/types'
import { stripWorkflowEmails } from '../../../../shared/utils/strip-workflow-emails'
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
      // strip emails from submitted steps and workflow
      const strippedSubmittedSteps = submissionData.submittedSteps?.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ nextStepRecipientEmails, ...rest }) => rest,
      )

      const strippedWorkflow: StrippedFormWorkflowDto = stripWorkflowEmails(
        submissionData.workflow,
      )

      const statusTrackerData: StatusTrackerData = {
        submittedSteps: strippedSubmittedSteps,
        workflow: strippedWorkflow,
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
