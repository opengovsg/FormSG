const formsgSdk = require('../../config/formsg-sdk')
const { validateWebhookUrl } = require('../../shared/util/webhook-validation')
const {
  postWebhook,
  handleWebhookSuccess,
  handleWebhookFailure,
  logWebhookFailure,
} = require('../services/webhooks.service')
const { WebhookValidationError } = require('../utils/custom-errors')

/**
 * POST submission to a specified URL.  Only works for encrypted submissions.
 * The webhook is fired on a best-effort basis, so the next middleware
 * is always called.
 * @param {Express.Request} req Express request object
 * @param {Object} req.form The form object containing the webhook URL
 * @param {Object} req.submission The submission saved to the database
 * @param {function} next Next middleware
 */
function post(req, _res, next) {
  const { form, submission } = req
  if (form.webhook.url) {
    const webhookUrl = form.webhook.url
    const now = Date.now()
    const submissionWebhookView = submission.getWebhookView()

    // Log and return, this should not happen.
    if (!submissionWebhookView) {
      logWebhookFailure(
        new WebhookValidationError('submissionWebhookView was null'),
        {
          webhookUrl,
          submissionWebhookView,
          now,
        },
      )
      return next()
    }

    const { submissionId, formId } = submissionWebhookView.data

    const signature = formsgSdk.webhooks.generateSignature({
      uri: form.webhook.url,
      submissionId,
      formId,
      epoch: now,
    })

    const webhookParams = {
      webhookUrl,
      submissionWebhookView,
      submissionId,
      formId,
      now,
      signature,
    }
    // Use promises instead of await to prevent the user from having to await on the
    // webhook before they receive acknowledgement that their submission was successful.
    validateWebhookUrl(webhookParams.webhookUrl)
      .then(() => postWebhook(webhookParams))
      .then((response) => {
        handleWebhookSuccess(response, webhookParams)
      })
      .catch((error) => {
        handleWebhookFailure(error, webhookParams)
      })
  }
  return next()
}

module.exports = {
  post,
}
