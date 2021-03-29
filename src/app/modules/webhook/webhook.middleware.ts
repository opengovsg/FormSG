import { Request, RequestHandler } from 'express'

import { WebhookFactory } from './webhook.factory'
import { WebhookRequestLocals } from './webhook.types'

/**
 * POST submission to a specified URL.  Only works for encrypted submissions.
 * The webhook is fired on a best-effort basis, so the next middleware
 * is always called.
 * @param {Express.Request} req Express request object
 * @param {Object} req.form The form object containing the webhook URL
 * @param {Object} req.submission The submission saved to the database
 * @param {Express.Response} res Express response object
 * @param {function} next Next middleware
 */
export const handleWebhook: RequestHandler = (req, _res, next) => {
  const { form, submission } = req as Request & WebhookRequestLocals
  const webhookUrl = form.webhook?.url
  if (webhookUrl) {
    // Note that we push data to webhook endpoints on a best effort basis
    // As such, we should not await on these post requests
    void WebhookFactory.sendWebhook(
      submission,
      webhookUrl,
    ).andThen((response) =>
      WebhookFactory.saveWebhookRecord(submission._id, response),
    )
  }
  return next()
}
