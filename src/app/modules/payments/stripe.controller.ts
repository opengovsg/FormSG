import { StatusCodes } from 'http-status-codes'

import { IStripeWebhookBody } from 'src/types'

import { ControllerHandler } from '../core/core.types'

export const handleStripeUpdates: ControllerHandler<
  unknown,
  never,
  IStripeWebhookBody
> = async (req, res) => {
  return res.sendStatus(StatusCodes.OK)
}
