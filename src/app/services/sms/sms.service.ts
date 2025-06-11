import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from 'src/app/config/logger'
import { PossibleDatabaseError } from 'src/app/modules/core/core.errors'
import { transformMongoError } from 'src/app/utils/handle-mongo-error'

import getSmsCountModel from './sms_count.server.model'

const logger = createLoggerWithLabel(module)
const SmsCount = getSmsCountModel(mongoose)

/**
 * Retrieves the free sms count for a particular user
 * @param formId The id of the form to retrieve the sms counts for
 * @returns ok(count) when retrieval is successful
 * @returns err(error) when retrieval fails due to a database error
 */
export const retrieveSmsCounts = (
  formId: string,
): ResultAsync<number, PossibleDatabaseError> => {
  return ResultAsync.fromPromise(
    SmsCount.retrieveSmsCounts(formId),
    (error) => {
      logger.error({
        message: `Retrieving free sms counts failed for ${formId}`,
        meta: {
          action: 'retrieveSmsCounts',
          formId,
          error,
        },
      })

      return transformMongoError(error)
    },
  )
}
