import { StatusCodes } from 'http-status-codes'

import { ErrorDto } from '../../../../shared/types'
import {
  ExampleFormsQueryDto,
  ExampleFormsResult,
  ExampleSingleFormResult,
} from '../../../types/api'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import { validateGetExamplesParams } from './examples.middlewares'
import * as ExamplesService from './examples.service'
import { mapRouteError } from './examples.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /examples endpoint.
 * @security session
 * @param exampleFormsQuery The search terms to find forms for
 * @returns 200 with an array of forms to be listed on the examples page
 * @returns 401 when user does not exist in session
 * @returns 500 when error occurs whilst querying the database
 */
export const _handleGetExamples: ControllerHandler<
  unknown,
  ErrorDto | ExampleFormsResult,
  unknown,
  ExampleFormsQueryDto
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

export const handleGetExamples = [
  validateGetExamplesParams,
  _handleGetExamples,
] as ControllerHandler[]

/**
 * Handler for GET /examples/:formId endpoint.
 * @security session
 * @param formId The id of the example form
 * @returns 200 with the retrieved form example
 * @returns 401 when user does not exist in session
 * @returns 404 when the form with given formId does not exist in the database
 * @returns 500 when error occurs whilst querying the database
 */
export const handleGetExampleByFormId: ControllerHandler<
  { formId: string },
  ExampleSingleFormResult | ErrorDto
> = (req, res) => {
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
