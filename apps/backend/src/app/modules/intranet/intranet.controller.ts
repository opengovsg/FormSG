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

/**
 * Handler for GET /intranet/is-ogp-check endpoint.
 * @returns whether the given IP address is an OGP IP
 */
export const handleGetIsOgpCheck: ControllerHandler<never, boolean> = (
  req,
  res,
) => {
  const ip = getRequestIp(req)
  const isOgp = IntranetService.isOgpIp(ip)
  return res.status(StatusCodes.OK).json(isOgp)
}

/**
 * Handler for GET /intranet/is-rbi-check endpoint.
 * @returns whether the given IP address is a Remote Browser Isolation proxy IP
 */
export const handleGetIsRbiCheck: ControllerHandler<never, boolean> = (
  req,
  res,
) => {
  const ip = getRequestIp(req)
  const isRbiProxy = IntranetService.isRbiIp(ip)
  return res.status(StatusCodes.OK).json(isRbiProxy)
}
