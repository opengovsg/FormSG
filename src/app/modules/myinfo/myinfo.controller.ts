import { celebrate, Joi, Segments } from 'celebrate'
import { Request } from 'express'
import { Query, RequestHandler } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'
import { createReqMeta } from '../../utils/request'
import { BillingFactory } from '../billing/billing.factory'
import * as FormService from '../form/form.service'
import { SpcpFactory } from '../spcp/spcp.factory'
import { LoginPageValidationResult } from '../spcp/spcp.types'

import { MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS } from './myinfo.constants'
import { MyInfoFactory } from './myinfo.factory'
import { MyInfoCookiePayload, MyInfoCookieState } from './myinfo.types'
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
  },
})

const respondWithRedirectURL: RequestHandler<
  unknown,
  { redirectURL: string } | { message: string },
  unknown,
  Query & { formId: string }
> = async (req, res) => {
  const { formId } = req.query
  return FormService.retrieveFormById(formId)
    .andThen((form) => validateMyInfoForm(form))
    .andThen((form) =>
      MyInfoFactory.createRedirectURL({
        formEsrvcId: form.esrvcId,
        formId,
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
  [Segments.QUERY]: Joi.alternatives().try(
    Joi.object()
      .keys({
        code: Joi.string().required(),
        state: Joi.string().required(),
      })
      // MyInfo sends several other params which are not necessary for Form
      .unknown(true),
    Joi.object().keys({
      'error-description': Joi.string().required(),
      error: Joi.string().required(),
      state: Joi.string().required(),
    }),
  ),
})

type MyInfoLoginQueryParams =
  | { code: string; state: string }
  | { error: string; 'error-description': string; state: string }

const loginToMyInfo: RequestHandler<
  unknown,
  unknown,
  unknown,
  MyInfoLoginQueryParams
> = async (req, res) => {
  const { state } = req.query
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
  const { formId, cookieDuration } = parseStateResult.value
  const redirectDestination = `/${formId}`

  // Ensure form exists
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.error({
      message: 'Form not found',
      meta: logMeta,
      error: formResult.error,
    })
    return res.sendStatus(StatusCodes.NOT_FOUND)
  }
  const form = formResult.value

  // Ensure form is a MyInfo form
  if (form.authType !== AuthType.MyInfo) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: logMeta,
    })
    res.cookie('isLoginError', true)
    return res.redirect(redirectDestination)
  }

  // Consent flow not successful
  if ('error' in req.query) {
    logger.error({
      message: 'Invalid MyInfo login query parameters',
      meta: {
        ...logMeta,
        error: req.query.error,
        errorDescription: req.query['error-description'],
      },
    })
    const cookiePayload: MyInfoCookiePayload = {
      state: MyInfoCookieState.ConsentError,
    }
    res.cookie(MYINFO_COOKIE_NAME, cookiePayload, MYINFO_COOKIE_OPTIONS)
    return res.redirect(redirectDestination)
  }

  // Consent flow successful, hence code is present
  const accessTokenResult = await MyInfoFactory.retrieveAccessToken(
    req.query.code,
  )
  if (accessTokenResult.isErr()) {
    logger.error({
      message: 'Error while retrieving MyInfo access token',
      meta: logMeta,
      error: accessTokenResult.error,
    })
    const cookiePayload: MyInfoCookiePayload = {
      state: MyInfoCookieState.RetrieveAccessTokenError,
    }
    res.cookie(MYINFO_COOKIE_NAME, cookiePayload, MYINFO_COOKIE_OPTIONS)
    return res.redirect(redirectDestination)
  }
  const accessToken = accessTokenResult.value

  // Once access token is retrieved, the request is assured to be legitimate,
  // so add the login
  return BillingFactory.recordLoginByForm(form)
    .map(() => {
      const cookiePayload: MyInfoCookiePayload = {
        accessToken,
        usedCount: 0,
        state: MyInfoCookieState.AccessTokenRetrieved,
      }
      res.cookie(MYINFO_COOKIE_NAME, cookiePayload, {
        maxAge: cookieDuration,
        ...MYINFO_COOKIE_OPTIONS,
      })
      return res.redirect(redirectDestination)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while adding MyInfo login record to database',
        meta: logMeta,
        error,
      })
      const cookiePayload: MyInfoCookiePayload = {
        state: MyInfoCookieState.AddLoginError,
      }
      res.cookie(MYINFO_COOKIE_NAME, cookiePayload, MYINFO_COOKIE_OPTIONS)
      return res.redirect(redirectDestination)
    })
}

export const handleMyInfoLogin = [
  validateMyInfoLogin,
  loginToMyInfo,
] as RequestHandler[]
