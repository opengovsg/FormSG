import { StatusCodes } from 'http-status-codes'

import { getRequestIp } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import { IntranetService } from './intranet.service'

/**
 * Handler for GET /intranet/is-intranet-check endpoint.
 * @returns whether the given IP address is an intranet IP
 */
export const handleGetIsIntranetCheck: ControllerHandler<never, boolean> = (
  req,
  res,
) => {
  const ip = getRequestIp(req)
  const isIntranet = IntranetService.isIntranetIp(ip)
  return res.status(StatusCodes.OK).json(isIntranet)
}
