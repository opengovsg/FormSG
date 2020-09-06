const webhook = require('../modules/webhook/webhook.controller')
const spcp = require('../controllers/spcp.server.controller')
const featureManager = require('../../config/feature-manager').default

const webhookVerifiedContentFactory = ({ isEnabled, props }) => {
  if (isEnabled && props) {
    return {
      encryptedVerifiedFields: spcp.encryptedVerifiedFields(
        props.signingSecretKey,
      ),
      post: webhook.post,
    }
  } else {
    return {
      encryptedVerifiedFields: (req, res, next) => next(),
      post: (req, res, next) => next(),
    }
  }
}

module.exports = webhookVerifiedContentFactory(
  featureManager.get('webhook-verified-content'),
)
