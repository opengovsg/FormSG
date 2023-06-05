import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { IPendingSubmissionSchema } from 'src/types'

import { getMongoErrorMessage } from '../../../app/utils/handle-mongo-error'
import { createLoggerWithLabel } from '../../config/logger'
import getPendingSubmissionModel from '../../models/pending_submission.server.model'
import { DatabaseError } from '../core/core.errors'
import { PendingSubmissionNotFoundError } from '../submission/submission.errors'

const logger = createLoggerWithLabel(module)
const PendingSubmissionModel = getPendingSubmissionModel(mongoose)

/**
 * @param pendingSubmissionId the submission id to find amongst all the pending submissions
 *
 * @returns ok(submission document) if retrieval is successful
 * @returns err(SubmissionNotFoundError) if pending submission does not exist in the database
 * @returns err(DatabaseError) if database errors occurs whilst retrieving pending submission
 */
export const findPendingSubmissionById = (
  pendingSubmissionId: string,
): ResultAsync<
  IPendingSubmissionSchema,
  DatabaseError | PendingSubmissionNotFoundError
> => {
  if (!mongoose.Types.ObjectId.isValid(pendingSubmissionId)) {
    return errAsync(new PendingSubmissionNotFoundError())
  }
  return ResultAsync.fromPromise(
    PendingSubmissionModel.findById(pendingSubmissionId).exec(),
    (error) => {
      logger.error({
        message: 'Database find submission error',
        meta: {
          action: 'findSubmissionById',
          pendingSubmissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((submission) => {
    if (!submission) {
      return errAsync(new PendingSubmissionNotFoundError())
    }
    return okAsync(submission)
  })
}
