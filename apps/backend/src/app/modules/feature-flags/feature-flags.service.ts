import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import getFeatureFlagModel from '../../models/feature_flag.server.model'
import { DatabaseError } from '../core/core.errors'

const logger = createLoggerWithLabel(module)
const FeatureFlagModel = getFeatureFlagModel(mongoose)

export const getEnabledFlags = (): ResultAsync<string[], DatabaseError> => {
  return ResultAsync.fromPromise(FeatureFlagModel.enabledFlags(), (error) => {
    logger.error({
      message: 'Database error when getting feature flag status',
      meta: {
        action: 'getEnabledFlags',
      },
      error,
    })

    return new DatabaseError('Unable to fetch enabled feature flags.')
  }).andThen((enabledFlagsDocs) =>
    okAsync(enabledFlagsDocs.map((doc) => doc.name)),
  )
}
