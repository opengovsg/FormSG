import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'
import { isUserInSession } from '../auth/auth.utils'

import { ExamplesFactory } from './examples.factory'
import { ExamplesQueryParams } from './examples.types'

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
