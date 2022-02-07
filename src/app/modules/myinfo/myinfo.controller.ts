import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import {
  FormAuthType,
  PublicFormAuthValidateEsrvcIdDto,
} from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import * as BillingService from '../billing/billing.service'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import { SpcpService } from '../spcp/spcp.service'

import { MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS } from './myinfo.constants'
import { MyInfoService } from './myinfo.service'
import { MyInfoCookiePayload, MyInfoCookieState } from './myinfo.types'
import {
  mapEServiceIdCheckError,
  mapRedirectURLError,
  validateMyInfoForm,
} from './myinfo.util'

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
 * Validation middleware for requests to check that an
 * e-service ID on a MyInfo form is valid.
 */
const validateEServiceIdCheck = celebrate({
  [Segments.QUERY]: {
    formId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  },
})

/**
 * Checks that a form's e-service ID is valid.
 * @param req Express request
 * @param res Express response
 */
export const checkMyInfoEServiceId: ControllerHandler<
  unknown,
  PublicFormAuthValidateEsrvcIdDto | { message: string },
  unknown,
  { formId: string }
> = async (req, res) => {
  const { formId } = req.query
  return FormService.retrieveFormById(formId)
    .andThen((form) => validateMyInfoForm(form))
    .andThen((form) =>
      SpcpService.createRedirectUrl(FormAuthType.SP, formId, form.esrvcId),
    )
    .andThen(SpcpService.fetchLoginPage)
    .andThen(SpcpService.validateLoginPage)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Error while validating MyInfo e-service ID',
        meta: {
          action: 'checkMyInfoEServiceId',
          ...createReqMeta(req),
          formId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapEServiceIdCheckError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handles requests to validate e-service ID for a MyInfo form.
 */
export const handleEServiceIdCheck = [
  validateEServiceIdCheck,
  checkMyInfoEServiceId,
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
 * Logs a user in to MyInfo by retrieving their access token and
 * redirecting them to the correct form.
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
  const { formId, cookieDuration, encodedQuery } = parseStateResult.value
  const redirectDestination = encodedQuery
    ? `/${formId}?${Buffer.from(encodedQuery, 'base64').toString('utf8')}`
    : `/${formId}`

  // Ensure form exists
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.error({
      message: 'Form in MyInfo relayState not found',
      meta: logMeta,
      error: formResult.error,
    })
    // No valid redirect destination, so redirect to home
    return res.redirect('/')
  }
  const form = formResult.value

  // Cookie payload for any errors while retrieving access token
  const errorCookiePayload: MyInfoCookiePayload = {
    state: MyInfoCookieState.Error,
  }

  // Ensure form is a MyInfo form
  if (form.authType !== FormAuthType.MyInfo) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: logMeta,
    })
    // Set cookie so that user still sees MyInfo error message.
    res.cookie(MYINFO_COOKIE_NAME, errorCookiePayload, MYINFO_COOKIE_OPTIONS)
    return res.redirect(redirectDestination)
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
    res.cookie(MYINFO_COOKIE_NAME, errorCookiePayload, MYINFO_COOKIE_OPTIONS)
    return res.redirect(redirectDestination)
  }

  // Consent flow successful, hence code is present
  const accessTokenResult = await MyInfoService.retrieveAccessToken(
    req.query.code,
  )
  if (accessTokenResult.isErr()) {
    logger.error({
      message: 'Error while retrieving MyInfo access token',
      meta: logMeta,
      error: accessTokenResult.error,
    })
    res.cookie(MYINFO_COOKIE_NAME, errorCookiePayload, MYINFO_COOKIE_OPTIONS)
    return res.redirect(redirectDestination)
  }
  const accessToken = accessTokenResult.value

  // Once access token is retrieved, the request is assured to be legitimate,
  // so add the login
  return BillingService.recordLoginByForm(form)
    .map(() => {
      const cookiePayload: MyInfoCookiePayload = {
        accessToken,
        usedCount: 0,
        state: MyInfoCookieState.Success,
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
      res.cookie(MYINFO_COOKIE_NAME, errorCookiePayload, MYINFO_COOKIE_OPTIONS)
      return res.redirect(redirectDestination)
    })
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
