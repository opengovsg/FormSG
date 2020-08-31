const featureManager = require('../../config/feature-manager').default
const frontend = require('../controllers/frontend.server.controller')
const { StatusCodes } = require('http-status-codes')

const googleAnalyticsFactory = ({ isEnabled }) => {
  if (isEnabled) {
    return {
      datalayer: frontend.datalayer,
    }
  } else {
    return {
      datalayer: (req, res) => {
        res.type('text/javascript').status(StatusCodes.OK).send()
      },
    }
  }
}

module.exports = googleAnalyticsFactory(featureManager.get('google-analytics'))
