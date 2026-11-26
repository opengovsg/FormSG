import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as OneMapController from '../../../../modules/onemap/onemap.controller'
import { limitRate } from '../../../../utils/limit-rate'

export const AddressRouter = Router()

/**
 * Looks up the block number and street name of a Singapore postal code.
 * @route GET /api/v3/address/postal-codes/:postalCode
 * @group address - address lookups for public form respondents
 * @param {string} postalCode.path.required - 6-digit postal code
 * @produces application/json
 * @returns 200 with the address
 * @returns 400 if the postal code is not 6 digits
 * @returns 404 if no address is found
 * @returns 429 if the rate limit is exceeded
 * @returns 502 if the OneMap request fails
 */
AddressRouter.get(
  '/postal-codes/:postalCode',
  limitRate({ max: rateLimitConfig.postalCodeLookup }),
  OneMapController.handleGetPostalCodeAddress,
)
