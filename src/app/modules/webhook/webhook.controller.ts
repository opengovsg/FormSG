import { NextFunction, Request, Response } from 'express'

import formsgSdk from '../../../config/formsg-sdk'

import { WebhookValidationError } from './webhook.errors'
import {
  handleWebhookFailure,
  handleWebhookSuccess,
  logWebhookFailure,
  postWebhook,
} from './webhook.service'
import { WebhookRequestLocals } from './webhook.types'
import { validateWebhookUrl } from './webhook.utils'

/**
 * POST submission to a specified URL.  Only works for encrypted submissions.
 * The webhook is fired on a best-effort basis, so the next middleware
 * is always called.
 * @param {Express.Request} req Express request object
 * @param {Object} req.form The form object containing the webhook URL
 * @param {Object} req.submission The submission saved to the database
 * @param {function} next Next middleware
 */

export function post(
  req: Request & WebhookRequestLocals,
  res: Response,
  next: NextFunction,
) {
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
    }) as string

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
