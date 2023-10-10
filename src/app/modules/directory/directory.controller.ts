import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'

import {
  getAgencyByShortName,
  getAgencyForms,
  getAllAgencies,
} from './directory.service'

const logger = createLoggerWithLabel(module)

/**
 * Controller for returning agencies to be listed
 * @returns 200
 * @returns 500 if a database error occurs
 */
export const handleGetAgencies: ControllerHandler = async (req, res) => {
  return getAllAgencies()
    .map((agencies) => {
      return res.json(
        agencies.map((agency) => ({
          fullName: agency.fullName,
          shortName: agency.shortName,
        })),
      )
    })
    .mapErr((error) => {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message })
    })
}

/**
 * Controller for returning forms owned by a given agency to be listed
 * @returns 200
 * @returns 500 if a database error occurs
 */
export const handleGetAgencyForms: ControllerHandler<{
  agencyShortName: string
}> = async (req, res) => {
  const shortName = req.params.agencyShortName
  return getAgencyByShortName(shortName)
    .andThen(getAgencyForms)
    .map((forms) => res.json(forms))
    .mapErr((error) => {
      logger.error({
        message: 'halp',
        meta: {
          action: 'handleGetAgencyForms',
        },
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message })
    })
}
