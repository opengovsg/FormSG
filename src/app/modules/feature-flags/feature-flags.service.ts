import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import getFeatureFlagModel from '../../models/feature_flag.server.model'
import { DatabaseError } from '../core/core.errors'

const logger = createLoggerWithLabel(module)
const FeatureFlagModel = getFeatureFlagModel(mongoose)

export const getFeatureFlag = (
  featureFlag: string,
): ResultAsync<boolean, DatabaseError> => {
  return ResultAsync.fromPromise(
    FeatureFlagModel.findFlag(featureFlag),
    (error) => {
      logger.error({
        message: 'Database error when getting feature flag status',
        meta: {
          action: 'findFlag',
        },
        error,
      })

      return new DatabaseError(`Unable to get feature flag status.`)
    },
  ).andThen((featureFlagDoc) => {
    return okAsync(!!featureFlagDoc?.enabled)
  })
}
