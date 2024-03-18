import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { FormResponseMode } from '../../../../../shared/types'
import {
  IMultirespondentSubmissionSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { getMultirespondentSubmissionModel } from '../../../models/submission.server.model'
import { transformMongoError } from '../../../utils/handle-mongo-error'
import { DatabaseError } from '../../core/core.errors'
import { isFormMultirespondent } from '../../form/form.utils'
import {
  ResponseModeError,
  SubmissionNotFoundError,
} from '../submission.errors'

const logger = createLoggerWithLabel(module)

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

export const checkFormIsMultirespondent = (
  form: IPopulatedForm,
): Result<IPopulatedMultirespondentForm, ResponseModeError> => {
  return isFormMultirespondent(form)
    ? ok(form)
    : err(
        new ResponseModeError(
          FormResponseMode.Multirespondent,
          form.responseMode,
        ),
      )
}

export const getMultirespondentSubmission = (
  submissionId: string,
): ResultAsync<
  IMultirespondentSubmissionSchema,
  DatabaseError | SubmissionNotFoundError
> =>
  ResultAsync.fromPromise(
    MultirespondentSubmission.findById(submissionId).exec(),
    (error) => {
      logger.error({
        message:
          'Error encountered while retrieving multirespondent submission',
        meta: {
          action: 'getMultirespondentSubmission',
          submissionId,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((submission) => {
    if (!submission) {
      return errAsync(new SubmissionNotFoundError())
    }
    return okAsync(submission)
  })
