import { StatusCodes } from 'http-status-codes'

import {
  FormAuthType,
  PublicFormAuthValidateEsrvcIdDto,
} from '../../../../shared/types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import * as BillingService from '../billing/billing.service'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

import { SpcpOidcService, SpcpService } from './spcp.service'
import { JwtName } from './spcp.types'
import { mapRouteError } from './spcp.util'

const logger = createLoggerWithLabel(module)

/**
 * Generates redirect URL to Official SingPass/CorpPass log in page
 * @param req - Express request object
 * @param res - Express response object
 */
export const handleRedirect: ControllerHandler<
  unknown,
  { redirectURL: string } | { message: string },
  unknown,
  {
    authType: FormAuthType.SP | FormAuthType.CP
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
  return SpcpService.createRedirectUrl(authType, target, esrvcId)
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
export const handleValidate: ControllerHandler<
  unknown,
  PublicFormAuthValidateEsrvcIdDto | { message: string },
  unknown,
  {
    authType: FormAuthType.SP | FormAuthType.CP
    target: string
    esrvcId: string
  }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  return SpcpService.createRedirectUrl(authType, target, esrvcId)
    .asyncAndThen(SpcpService.fetchLoginPage)
    .andThen(SpcpService.validateLoginPage)
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
  authType: FormAuthType.SP | FormAuthType.CP,
) => ControllerHandler<
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
  const parseResult = SpcpService.parseOOBParams(SAMLart, RelayState, authType)
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
  const jwtResult = await SpcpService.getSpcpAttributes(
    SAMLart,
    destination,
    authType,
  )
    .andThen((attributes) =>
      SpcpService.createJWTPayload(attributes, rememberMe, authType),
    )
    .andThen((jwtPayload) =>
      SpcpService.createJWT(jwtPayload, cookieDuration, authType),
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
  return BillingService.recordLoginByForm(form)
    .map(() => {
      res.cookie(JwtName[authType], jwtResult.value, {
        maxAge: cookieDuration,
        httpOnly: true,
        sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
        secure: !config.isDev,
        ...SpcpService.getCookieSettings(),
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

/**
 * Handler to return the public JWKS hosted on the app's well known end point
 * @returns public JWKS in json format
 */
export const handleGetWellKnown: ControllerHandler<
  unknown,
  Record<string, unknown>,
  unknown,
  unknown
> = (_req, res) => {
  return res.json(SpcpOidcService.publicJwks)
}
