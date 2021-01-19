import { RequestHandler } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../utils/request'

import * as ExamplesService from './examples.service'
import { ExamplesQueryParams } from './examples.types'
import { mapRouteError } from './examples.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /examples endpoint.
 * @security session
 * @returns 200 with an array of forms to be listed on the examples page
 * @returns 401 when user does not exist in session
 * @returns 500 when error occurs whilst querying the database
 */
export const handleGetExamples: RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  Query & ExamplesQueryParams
> = (req, res) => {
  return ExamplesService.getExampleForms(req.query)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Failed to retrieve example forms',
        meta: {
          action: 'handleGetExamples',
          ...createReqMeta(req),
        },
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error retrieving example forms' })
    })
}

/**
 * Handler for GET /examples/:formId endpoint.
 * @security session
 * @returns 200 with the retrieved form example
 * @returns 401 when user does not exist in session
 * @returns 404 when the form with given formId does not exist in the database
 * @returns 500 when error occurs whilst querying the database
 */
export const handleGetExampleByFormId: RequestHandler<{
  formId: string
}> = (req, res) => {
  const { formId } = req.params

  return ExamplesService.getSingleExampleForm(formId)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Failed to retrieve single example form',
        meta: {
          action: 'handleGetExampleByFormId',
          ...createReqMeta(req),
          formId,
        },
        error,
      })

      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
