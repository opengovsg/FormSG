import { ResultAsync } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { DatabaseError } from '../core/core.errors'

import {
  getFormCountWithStatsCollection,
  getFormCountWithSubmissionCollection,
} from './analytics.service'

interface IAnalyticsFactory {
  getFormCount: () => ResultAsync<number, DatabaseError>
}

const aggregateFeature = FeatureManager.get(FeatureNames.AggregateStats)

// Exported for testing.
export const createAnalyticsFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.AggregateStats>): IAnalyticsFactory => {
  if (isEnabled && props) {
    return {
      getFormCount: getFormCountWithStatsCollection,
    }
  }

  // Not enabled, return retrieve forms with submissions collection
  return {
    getFormCount: getFormCountWithSubmissionCollection,
  }
}

export const AnalyticsFactory = createAnalyticsFactory(aggregateFeature)
