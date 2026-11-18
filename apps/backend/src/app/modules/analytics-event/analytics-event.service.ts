import { ObjectId } from 'bson'
import { AnalyticsEventInput, AnalyticsEventType } from 'formsg-shared/types'
import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { IAnalyticsEventSchema, IPopulatedForm } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getAnalyticsEventModel from '../../models/analytics_event.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

const AnalyticsEventModel = getAnalyticsEventModel(mongoose)
const logger = createLoggerWithLabel(module)

const withServerContent = (
  event: AnalyticsEventInput,
  now: Date,
): Record<string, unknown> => {
  if (event.type !== AnalyticsEventType.ResultsSavedViewApplied) {
    return event.content
  }
  const createdAt = new ObjectId(event.content.savedViewId).getTimestamp()
  return {
    ...event.content,
    savedViewAgeMs: Math.max(0, now.getTime() - createdAt.getTime()),
  }
}

export const createAnalyticsEvent = ({
  form,
  adminId,
  event,
  now = new Date(),
}: {
  form: IPopulatedForm
  adminId: string
  event: AnalyticsEventInput
  now?: Date
}): ResultAsync<IAnalyticsEventSchema, DatabaseError> =>
  ResultAsync.fromPromise(
    AnalyticsEventModel.create({
      type: event.type,
      form: form._id,
      admin: adminId,
      content: withServerContent(event, now),
    }),
    (error) => {
      logger.error({
        message: 'Database error when creating analytics event',
        meta: {
          action: 'createAnalyticsEvent',
          formId: form._id,
          type: event.type,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
