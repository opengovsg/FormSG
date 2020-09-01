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
  const { form, submission } = req
  const webhookUrl = form.webhook.url
  const submissionWebhookView = submission.getWebhookView()
  if (webhookUrl) {
    pushData(webhookUrl, submissionWebhookView)
  }
  return next()
}
