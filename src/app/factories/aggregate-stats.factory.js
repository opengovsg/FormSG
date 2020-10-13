const featureManager = require('../../config/feature-manager').default
const adminConsole = require('../controllers/admin-console.server.controller')

const aggregStatsFactory = ({ isEnabled }) => {
  if (isEnabled) {
    return {
      getExampleForms: adminConsole.getExampleFormsUsingAggregateCollection,
      getSingleExampleForm:
        adminConsole.getSingleExampleFormUsingAggregateCollection,
    }
  } else {
    return {
      getExampleForms: adminConsole.getExampleFormsUsingSubmissionsCollection,
      getSingleExampleForm:
        adminConsole.getSingleExampleFormUsingSubmissionCollection,
    }
  }
}

module.exports = aggregStatsFactory(featureManager.get('aggregate-stats'))
