import { StatusCodes } from 'http-status-codes'

import { IStripeEventWebhookBody } from 'src/types'

import { ControllerHandler } from '../core/core.types'

export const handleStripeUpdates: ControllerHandler<
  unknown,
  never,
  IStripeEventWebhookBody
> = async (req, res) => {
  return res.sendStatus(StatusCodes.OK)
}
