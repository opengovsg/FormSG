import { celebrate, Joi, Segments } from 'celebrate'
import { ErrorDto, PostalCodeAddressDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { ControllerHandler } from '../core/core.types'

import * as OneMapService from './onemap.service'

const validateGetPostalCodeAddressParams = celebrate({
  [Segments.PARAMS]: Joi.object({
    postalCode: Joi.string()
      .pattern(/^\d{6}$/)
      .required(),
  }),
})

/**
 * Handler for GET /api/v3/address/postal-codes/:postalCode
 * @returns 200 with the block number and street name of the postal code
 * @returns 400 if the postal code is not 6 digits
 * @returns 404 if OneMap has no address for the postal code
 * @returns 502 if the OneMap request fails
 */
const getPostalCodeAddress: ControllerHandler<
  { postalCode: string },
  PostalCodeAddressDto | ErrorDto
> = (req, res) =>
  OneMapService.searchPostalCode(req.params.postalCode).match(
    (address) =>
      address
        ? res.json(address)
        : res
            .status(StatusCodes.NOT_FOUND)
            .json({ message: 'No address found for this postal code' }),
    () =>
      res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ message: 'Address lookup is unavailable' }),
  )

export const handleGetPostalCodeAddress = [
  validateGetPostalCodeAddressParams,
  getPostalCodeAddress,
] as ControllerHandler[]
