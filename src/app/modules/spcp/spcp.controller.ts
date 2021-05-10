import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { AuthType } from '../../../types'
import { PublicFormAuthValidateEsrvcIdDto } from '../../../types/api'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { BillingFactory } from '../billing/billing.factory'
import * as FormService from '../form/form.service'

import { SpcpFactory } from './spcp.factory'
import { JwtName } from './spcp.types'
import { mapRouteError } from './spcp.util'

const logger = createLoggerWithLabel(module)

/**
 * Generates redirect URL to Official SingPass/CorpPass log in page
 * @param req - Express request object
 * @param res - Express response object
 */
export const handleRedirect: RequestHandler<
  unknown,
  { redirectURL: string } | { message: string },
  unknown,
  {
    authType: AuthType.SP | AuthType.CP
    target: string
    esrvcId: string
  }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  const logMeta = {
    action: 'handleRedirect',
    ...createReqMeta(req),
    authType,
    target,
    esrvcId,
  }
  return SpcpFactory.createRedirectUrl(authType, target, esrvcId)
    .map((redirectURL) => {
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Validates the given e-service ID.
 * @param req - Express request object
 * @param res - Express response object
 */
export const handleValidate: RequestHandler<
  unknown,
  PublicFormAuthValidateEsrvcIdDto | { message: string },
  unknown,
  {
    authType: AuthType.SP | AuthType.CP
    target: string
    esrvcId: string
  }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  return SpcpFactory.createRedirectUrl(authType, target, esrvcId)
    .asyncAndThen(SpcpFactory.fetchLoginPage)
    .andThen(SpcpFactory.validateLoginPage)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Error while validating e-service ID',
        meta: {
          action: 'handleValidate',
          ...createReqMeta(req),
          authType,
          target,
          esrvcId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Higher-order function which returns an Express handler to handle Singpass
 * and Corppass login requests.
 * @param authType 'SP' or 'CP'
 */
export const handleLogin: (
  authType: AuthType.SP | AuthType.CP,
) => RequestHandler<
  unknown,
  unknown,
  unknown,
  { SAMLart: string; RelayState: string }
> = (authType) => async (req, res) => {
  const { SAMLart, RelayState } = req.query
  const logMeta = {
    action: 'handleLogin',
    samlArt: SAMLart,
    relayState: RelayState,
  }
  const parseResult = SpcpFactory.parseOOBParams(SAMLart, RelayState, authType)
  if (parseResult.isErr()) {
    logger.error({
      message: 'Invalid SPCP login parameters',
      meta: logMeta,
      error: parseResult.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
  const { formId, destination, rememberMe, cookieDuration } = parseResult.value
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
  if (form.authType !== authType) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: {
        ...logMeta,
        formAuthType: form.authType,
        endpointAuthType: authType,
      },
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }
  const jwtResult = await SpcpFactory.getSpcpAttributes(
    SAMLart,
    destination,
    authType,
  )
    .andThen((attributes) =>
      SpcpFactory.createJWTPayload(attributes, rememberMe, authType),
    )
    .andThen((jwtPayload) =>
      SpcpFactory.createJWT(jwtPayload, cookieDuration, authType),
    )
  if (jwtResult.isErr()) {
    logger.error({
      message: 'Error creating JWT',
      meta: logMeta,
      error: jwtResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }
  return BillingFactory.recordLoginByForm(form)
    .map(() => {
      res.cookie(JwtName[authType], jwtResult.value, {
        maxAge: cookieDuration,
        httpOnly: false, // the JWT needs to be read by client-side JS
        sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
        secure: !config.isDev,
        ...SpcpFactory.getCookieSettings(),
      })
      return res.redirect(destination)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while adding login to database',
        meta: logMeta,
        error,
      })
      res.cookie('isLoginError', true)
      return res.redirect(destination)
    })
}
