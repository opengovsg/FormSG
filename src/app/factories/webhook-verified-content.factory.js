const webhook = require('../modules/webhook/webhook.controller')
const featureManager = require('../../config/feature-manager').default

const webhookVerifiedContentFactory = ({ isEnabled, props }) => {
  if (isEnabled && props) {
    return {
      post: webhook.post,
    }
  } else {
    return {
      post: (req, res, next) => next(),
    }
  }
}

module.exports = webhookVerifiedContentFactory(
  featureManager.get('webhook-verified-content'),
)
