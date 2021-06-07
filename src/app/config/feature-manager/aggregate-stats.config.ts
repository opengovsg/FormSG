import { FeatureNames, RegisterableFeature } from './types'

const aggregateCollectionFeature: RegisterableFeature<FeatureNames.AggregateStats> =
  {
    name: FeatureNames.AggregateStats,
    schema: {
      aggregateCollection: {
        doc: 'Has to be defined (i.e. =true) if FormStats collection is to be used',
        format: '*',
        default: null,
        env: 'AGGREGATE_COLLECTION',
      },
    },
  }

export default aggregateCollectionFeature
