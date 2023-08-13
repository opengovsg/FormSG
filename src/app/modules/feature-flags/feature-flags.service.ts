import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'

import { featureFlags } from '../../../../shared/constants'
import { createLoggerWithLabel, CustomLoggerParams } from '../../config/logger'
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

/**
 * Wrapper over getEnabledFlags function to gracefully handle errors
 * and returns the `options.defaultValue` instead.
 *
 * @example
 * ```
 * const logMeta = {
 *  action: 'linkStripeAccountToForm',
 * }
 * return getFeatureFlag(featureFlags.validateStripeEmailDomain, {
 *  defaultValue: false,
 *  logMeta,
 * })
 *.andThen((shouldValidateStripeEmailDomain) => ...)
 *```
 *
 * @param flag
 * @param options.defaultValue the value in the event that there's an error retrieving the feature flag
 * @returns boolean that represents the status of the feature flag or the default value
 */
export const getFeatureFlag = (
  flag: keyof typeof featureFlags,
  options?: {
    defaultValue?: boolean
    logMeta?: CustomLoggerParams['meta']
  },
): ResultAsync<boolean, DatabaseError> => {
  const _defaultValue = options?.defaultValue ?? false
  return getEnabledFlags()
    .andThen((featureFlagsListResult) =>
      okAsync(featureFlagsListResult.includes(flag)),
    )
    .orElse((error) => {
      logger.error({
        message: 'Error occurred whilst retrieving enabled feature flags',
        meta: options?.logMeta
          ? options.logMeta
          : {
              action: 'getFeatureFlag',
            },
        error,
      })
      return okAsync(_defaultValue)
    })
}
