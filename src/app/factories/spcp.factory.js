const spcp = require('../controllers/spcp.server.controller')
const featureManager = require('../../config/feature-manager').default

const spcpFactory = ({ isEnabled, props }) => {
  if (isEnabled && props) {
    return {
      appendVerifiedSPCPResponses: spcp.appendVerifiedSPCPResponses,
    }
  } else {
    return {
      appendVerifiedSPCPResponses: (req, res, next) => next(),
    }
  }
}

module.exports = spcpFactory(featureManager.get('spcp-myinfo'))
