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
        res.type('text/javascript').sendStatus(StatusCodes.OK)
      },
    }
  }
}

module.exports = googleAnalyticsFactory(featureManager.get('google-analytics'))
