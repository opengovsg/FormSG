import { celebrate, Joi, Segments } from 'celebrate'
import { Request } from 'express'
import { Query, RequestHandler } from 'express-serve-static-core'
import { errAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'
import { createReqMeta } from '../../utils/request'
import * as FormService from '../form/form.service'

import { MyInfoAuthTypeError } from './myinfo.errors'
import { MyInfoFactory } from './myinfo.factory'
import { mapRedirectURLError } from './myinfo.util'

const logger = createLoggerWithLabel(module)

const validateRedirectURLRequest = celebrate({
  [Segments.QUERY]: {
    formId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    rememberMe: Joi.boolean().required(),
  },
})

const respondWithRedirectURL: RequestHandler<
  unknown,
  { redirectURL: string } | { message: string },
  unknown,
  Query & { formId: string; rememberMe: boolean }
> = async (req, res) => {
  const { formId, rememberMe } = req.query
  return FormService.retrieveFormById(formId)
    .andThen((form) => {
      if (form.authType !== AuthType.MyInfo || !form.esrvcId) {
        return errAsync(new MyInfoAuthTypeError())
      }
      return MyInfoFactory.createRedirectURL({
        formEsrvcId: form.esrvcId,
        formId,
        formTitle: form.title,
        rememberMe,
        requestedAttributes: form.getUniqueMyInfoAttrs(),
      }).map((redirectURL) => res.json({ redirectURL }))
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating MyInfo redirect URL',
        meta: {
          action: 'respondWithRedirectURL',
          ...createReqMeta(req as Request),
          formId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapRedirectURLError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleRedirectURLRequest = [
  validateRedirectURLRequest,
  respondWithRedirectURL,
] as RequestHandler[]
