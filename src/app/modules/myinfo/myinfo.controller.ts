import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

import {
  MYINFO_AUTH_CODE_COOKIE_NAME,
  MYINFO_AUTH_CODE_COOKIE_OPTIONS,
} from './myinfo.constants'
import { MyInfoService } from './myinfo.service'
import {
  MyInfoAuthCodeCookiePayload,
  MyInfoAuthCodeCookieState,
  MyInfoAuthCodeSuccessPayload,
} from './myinfo.types'
import { mapRedirectURLError, validateMyInfoForm } from './myinfo.util'

const logger = createLoggerWithLabel(module)

/**
 * Validation middleware for the endpoint which generates
 * the MyInfo redirect URL.
 */
const validateRedirectURLRequest = celebrate({
  [Segments.QUERY]: {
    formId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  },
})

/**
 * Creates the URL to which the client should be
 * redirected to login to MyInfo for a form.
 * @param req Express Request
 * @param res Express Response
 */
export const respondWithRedirectURL: ControllerHandler<
  unknown,
  { redirectURL: string } | { message: string },
  unknown,
  { formId: string; encodedQuery?: string }
> = async (req, res) => {
  const { formId, encodedQuery } = req.query
  return FormService.retrieveFormById(formId)
    .andThen((form) => validateMyInfoForm(form))
    .andThen((form) =>
      MyInfoService.createRedirectURL({
        formEsrvcId: form.esrvcId,
        formId,
        requestedAttributes: form.getUniqueMyInfoAttrs(),
        encodedQuery,
      }),
    )
    .map((redirectURL) => res.json({ redirectURL }))
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating MyInfo redirect URL',
        meta: {
          action: 'respondWithRedirectURL',
          ...createReqMeta(req),
          formId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapRedirectURLError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handles request for a redirect URL for a MyInfo form.
 */
export const handleRedirectURLRequest = [
  validateRedirectURLRequest,
  respondWithRedirectURL,
] as ControllerHandler[]

/**
 * Validation middleware for the MyInfo redirect endpoint.
 * This is the endpoint to which MyInfo will redirect the client
 * after they have consented to provide their MyInfo data.
 */
const validateMyInfoLogin = celebrate({
  [Segments.QUERY]: Joi.alternatives().try(
    Joi.object()
      .keys({
        code: Joi.string().required(),
        state: Joi.string().required(),
      })
      // MyInfo sends several other params which are not necessary for Form
      .unknown(true),
    Joi.object()
      .keys({
        'error-description': Joi.string(),
        error: Joi.string().required(),
        state: Joi.string().required(),
      })
      // Allow other params in case MyInfo adds them in future
      .unknown(true),
  ),
})

type MyInfoLoginQueryParams =
  | { code: string; state: string }
  | {
      error: string
      'error-description'?: string
      state: string
    }

/**
 * Logs a user in to MyInfo by storing the authorisation code
 * in a cookie and redirecting them to the correct form.
 * @param req Express request
 * @param res Express response
 */
export const loginToMyInfo: ControllerHandler<
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
  const parseStateResult = MyInfoService.parseMyInfoRelayState(state)
  if (parseStateResult.isErr()) {
    logger.error({
      message: 'Invalid MyInfo login query parameters',
      meta: logMeta,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
  const { formId, encodedQuery } = parseStateResult.value

  let redirectDestination = `/${formId}`

  if (encodedQuery) {
    try {
      redirectDestination = `/${formId}?${Buffer.from(
        encodedQuery,
        'base64',
      ).toString('utf8')}`
    } catch {
      // Buffer.from might throw an error if there is a badly encoded
      // string, in which case we will fall back to the default.
    }
  }

  // Cookie payload for error returned by MyInfo
  const errorCookiePayload: MyInfoAuthCodeCookiePayload = {
    state: MyInfoAuthCodeCookieState.Error,
  }

  // Consent flow not successful
  if ('error' in req.query) {
    logger.error({
      message: 'MyInfo returned error from consent flow',
      meta: {
        ...logMeta,
        error: req.query.error,
        errorDescription: req.query['error-description'],
      },
    })
    res.cookie(
      MYINFO_AUTH_CODE_COOKIE_NAME,
      errorCookiePayload,
      MYINFO_AUTH_CODE_COOKIE_OPTIONS,
    )
    return res.redirect(redirectDestination)
  }

  const cookiePayload: MyInfoAuthCodeSuccessPayload = {
    authCode: req.query.code,
    state: MyInfoAuthCodeCookieState.Success,
  }
  res.cookie(
    MYINFO_AUTH_CODE_COOKIE_NAME,
    cookiePayload,
    MYINFO_AUTH_CODE_COOKIE_OPTIONS,
  )
  return res.redirect(redirectDestination)
}

/**
 * Handles redirects from MyInfo after user has
 * logged in to SingPass and given consent to provide their
 * MyInfo data.
 */
export const handleMyInfoLogin = [
  validateMyInfoLogin,
  loginToMyInfo,
] as ControllerHandler[]
