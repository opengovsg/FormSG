import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'
import { isUserInSession } from '../auth/auth.utils'

import { ExamplesFactory } from './examples.factory'
import { ExamplesQueryParams } from './examples.types'
import { mapRouteError } from './examples.utils'

const logger = createLoggerWithLabel(module)

export const handleGetExamples: RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  ExamplesQueryParams
> = (req, res) => {
  if (!isUserInSession(req)) {
    return res.status(StatusCodes.UNAUTHORIZED).json('User is unauthorized.')
  }

  return ExamplesFactory.getExampleForms(req.query)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Failed to retrieve example forms',
        meta: {
          action: 'handleGetExamples',
          ip: getRequestIp(req),
          url: req.url,
          headers: req.headers,
        },
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json('Error retrieving example forms')
    })
}

export const handleGetExampleByFormId: RequestHandler<{
  formId: string
}> = (req, res) => {
  if (!isUserInSession(req)) {
    return res.status(StatusCodes.UNAUTHORIZED).json('User is unauthorized.')
  }

  const { formId } = req.params

  return ExamplesFactory.getSingleExampleForm(formId)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Failed to retrieve single example form',
        meta: {
          action: 'handleGetExampleByFormId',
          ip: getRequestIp(req),
          url: req.url,
          headers: req.headers,
          formId,
        },
        error,
      })

      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json(errorMessage)
    })
}
