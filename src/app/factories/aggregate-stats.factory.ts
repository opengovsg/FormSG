import { RequestHandler } from 'express'

import FeatureManager, { FeatureNames } from '../../config/feature-manager'
import * as AdminConsoleController from '../controllers/admin-console.server.controller'

// TODO(af): Make returned functions pure with services instead of RequestHandler.
interface IExamplesFactory {
  getExampleForms: RequestHandler
  getSingleExampleForm: RequestHandler
}

const createAggregateStatsFactory = (): IExamplesFactory => {
  const aggregateStatsFeature = FeatureManager.get(FeatureNames.AggregateStats)

  if (aggregateStatsFeature.isEnabled) {
    return {
      getExampleForms:
        AdminConsoleController.getExampleFormsUsingAggregateCollection,
      getSingleExampleForm:
        AdminConsoleController.getSingleExampleFormUsingAggregateCollection,
    }
  }

  // Aggregate stats is not enabled, retrieve from submission collection.
  return {
    getExampleForms:
      AdminConsoleController.getExampleFormsUsingSubmissionsCollection,
    getSingleExampleForm:
      AdminConsoleController.getSingleExampleFormUsingSubmissionCollection,
  }
}

export const AggregateStatsFactory = createAggregateStatsFactory()
