import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import { IStripeEventWebhookBody } from 'src/types'

import { ControllerHandler } from '../core/core.types'

/**
 * Middleware which validates that a request came from Twilio Webhook
 * by checking the presence of X-Twilio-Sgnature in request header and
 * sms delivery status request body parameters
 */
const validateStripeEvent = celebrate({
  [Segments.HEADERS]: Joi.object({
    'Stripe-Signature': Joi.string().required(),
  }).unknown(),
  [Segments.BODY]: Joi.object()
    .keys({
      id: Joi.string().required(),
      api_version: Joi.string().required(),
      data: Joi.object()
        .keys({
          object: Joi.object().required(),
          previous_attributes: Joi.object().required(),
        })
        .required(),
      request: Joi.object()
        .keys({
          id: Joi.string().required(),
          idempotency_key: Joi.string().required(),
        })
        .required(),
      type: Joi.string().required(),
      object: Joi.string().required(),
      account: Joi.string().required(),
      created: Joi.number().integer().min(0).required(),
      livemode: Joi.boolean().required(),
      pending_webhooks: Joi.number().min(0).required(),
    })
    .unknown(),
})

export const _handleStripeEventUpdates: ControllerHandler<
  unknown,
  never,
  IStripeEventWebhookBody
> = async (req, res) => {
  req.body
  return res.sendStatus(StatusCodes.OK)
}

export const handleStripeEventUpdates = [
  validateStripeEvent,
  _handleStripeEventUpdates,
]
