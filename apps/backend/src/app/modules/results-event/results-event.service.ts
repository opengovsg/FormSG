import { ObjectId } from 'bson'
import { ResultsEventInput, ResultsEventType } from 'formsg-shared/types'
import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { IPopulatedForm, IResultsEventSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getResultsEventModel from '../../models/results_event.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

const ResultsEventModel = getResultsEventModel(mongoose)
const logger = createLoggerWithLabel(module)

export const createResultsEvent = ({
  form,
  adminId,
  event,
  now = new Date(),
}: {
  form: IPopulatedForm
  adminId: string
  event: ResultsEventInput
  now?: Date
}): ResultAsync<IResultsEventSchema, DatabaseError> => {
  const savedViewAgeMs =
    event.type === ResultsEventType.SavedViewApplied
      ? Math.max(
          0,
          now.getTime() -
            new ObjectId(event.savedViewId).getTimestamp().getTime(),
        )
      : undefined

  return ResultAsync.fromPromise(
    ResultsEventModel.create({
      ...event,
      form: form._id,
      admin: adminId,
      ...(savedViewAgeMs !== undefined ? { savedViewAgeMs } : {}),
    }),
    (error) => {
      logger.error({
        message: 'Database error when creating results event',
        meta: {
          action: 'createResultsEvent',
          formId: form._id,
          type: event.type,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}
