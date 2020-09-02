import { NextFunction, Request, Response } from 'express'

import { pushData } from './webhook.service'
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
export const post = (
  req: Request & WebhookRequestLocals,
  res: Response,
  next: NextFunction,
) => {
  // TODO: Once we move away from the middleware pattern, there should not be a webhook controller
  // There should only be a webhook service, which is called within the submission controller
  // This will also remove the need for retrieval of form/submission from req.
  const { form, submission } = req
  const webhookUrl = form.webhook.url
  const submissionWebhookView = submission.getWebhookView()
  if (webhookUrl) {
    // Note that we push data to webhook endpoints on a best effort basis
    // As such, we should not await on these post requests
    pushData(webhookUrl, submissionWebhookView)
  }
  return next()
}
