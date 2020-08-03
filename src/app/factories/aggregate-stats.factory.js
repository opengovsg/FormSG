const featureManager = require('../../config/feature-manager').default
const core = require('../controllers/core.server.controller')
const adminConsole = require('../controllers/admin-console.server.controller')

const aggregStatsFactory = ({ isEnabled }) => {
  if (isEnabled) {
    return {
      getExampleForms: adminConsole.getExampleFormsUsingAggregateCollection,
      getSingleExampleForm:
        adminConsole.getSingleExampleFormUsingAggregateCollection,
      formCount: core.formCountUsingAggregateCollection,
    }
  } else {
    return {
      getExampleForms: adminConsole.getExampleFormsUsingSubmissionsCollection,
      getSingleExampleForm:
        adminConsole.getSingleExampleFormUsingSubmissionCollection,
      formCount: core.formCountUsingSubmissionsCollection,
    }
  }
}

module.exports = aggregStatsFactory(featureManager.get('aggregate-stats'))
