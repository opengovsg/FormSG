import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../config/feature-manager'

import * as ExamplesService from './examples.service'
import { RetrievalType } from './examples.types'

interface IExamplesFactory {
  getExampleForms: ReturnType<typeof ExamplesService.getExampleForms>
  getSingleExampleForm: ReturnType<typeof ExamplesService.getSingleExampleForm>
}

const aggregateFeature = FeatureManager.get(FeatureNames.AggregateStats)

// Exported for testing.
export const createExamplesFactory = ({
  isEnabled,
}: RegisteredFeature<FeatureNames.AggregateStats>): IExamplesFactory => {
  // Set retrieval type to use statistics collection if feature is enabled.
  const retrievalType = isEnabled
    ? RetrievalType.Stats
    : RetrievalType.Submissions
  return {
    getExampleForms: ExamplesService.getExampleForms(retrievalType),
    getSingleExampleForm: ExamplesService.getSingleExampleForm(retrievalType),
  }
}

export const ExamplesFactory = createExamplesFactory(aggregateFeature)
