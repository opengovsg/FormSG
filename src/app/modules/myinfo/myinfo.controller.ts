import { celebrate, Joi, Segments } from 'celebrate'
import { Request } from 'express'
import { Query, RequestHandler } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'
import { createReqMeta } from '../../utils/request'
import * as FormService from '../form/form.service'
import { SpcpFactory } from '../spcp/spcp.factory'
import { LoginPageValidationResult } from '../spcp/spcp.types'

import { MyInfoFactory } from './myinfo.factory'
import { MyInfoCookieName, MyInfoCookiePayload } from './myinfo.types'
import {
  mapEServiceIdCheckError,
  mapRedirectURLError,
  validateMyInfoForm,
} from './myinfo.util'

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
    .andThen((form) => validateMyInfoForm(form))
    .andThen((form) =>
      MyInfoFactory.createRedirectURL({
        formEsrvcId: form.esrvcId,
        formId,
        formTitle: form.title,
        rememberMe,
        requestedAttributes: form.getUniqueMyInfoAttrs(),
      }),
    )
    .map((redirectURL) => res.json({ redirectURL }))
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

const validateEServiceIdCheck = celebrate({
  [Segments.QUERY]: {
    formId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  },
})

const checkMyInfoEServiceId: RequestHandler<
  unknown,
  LoginPageValidationResult | { message: string },
  unknown,
  Query & { formId: string }
> = async (req, res) => {
  const { formId } = req.query
  return FormService.retrieveFormById(formId)
    .andThen((form) => validateMyInfoForm(form))
    .andThen((form) =>
      SpcpFactory.createRedirectUrl(AuthType.SP, formId, form.esrvcId),
    )
    .andThen(SpcpFactory.fetchLoginPage)
    .andThen(SpcpFactory.validateLoginPage)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Error while validating MyInfo e-service ID',
        meta: {
          action: 'checkMyInfoEServiceId',
          ...createReqMeta(req as Request),
          formId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapEServiceIdCheckError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleEServiceIdCheck = [
  validateEServiceIdCheck,
  checkMyInfoEServiceId,
] as RequestHandler[]

const validateMyInfoLogin = celebrate({
  [Segments.QUERY]: {
    code: Joi.string().required(),
    state: Joi.string().required(),
  },
})

const loginToMyInfo: RequestHandler<
  unknown,
  unknown,
  unknown,
  Query & { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query
  const logMeta = {
    action: 'loginToMyInfo',
    state,
  }
  const parseStateResult = MyInfoFactory.parseMyInfoRelayState(state)
  if (parseStateResult.isErr()) {
    logger.error({
      message: 'Invalid MyInfo login query parameters',
      meta: logMeta,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
  const { formId, cookieDuration, isPreview } = parseStateResult.value
  const redirectDestination = `/${formId}${isPreview ? '/preview' : ''}`
  return MyInfoFactory.retrieveAccessToken(code)
    .map((accessToken) => {
      const cookiePayload: MyInfoCookiePayload = {
        accessToken,
        usedCount: 0,
      }
      res.cookie(MyInfoCookieName.MyInfoAccessToken, cookiePayload, {
        maxAge: cookieDuration,
        // Important for security - access token cannot be read by client-side JS
        httpOnly: true,
        sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
        secure: !config.isDev,
      })
      return res.redirect(redirectDestination)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while retrieving MyInfo access token',
        meta: logMeta,
        error,
      })
      res.cookie(MyInfoCookieName.MyInfoError, true)
      return res.redirect(redirectDestination)
    })
}

export const handleMyInfoLogin = [
  validateMyInfoLogin,
  loginToMyInfo,
] as RequestHandler[]
