import { StatusCodes } from 'http-status-codes'

import { FormAuthType } from '../../../../shared/types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import * as BillingService from '../billing/billing.service'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

import { SpOidcService } from './sp.oidc.service'
import { SpcpService } from './spcp.service'
import { JwtName } from './spcp.types'

const logger = createLoggerWithLabel(module)

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
 * Handler for SP OIDC logins
 */
export const handleSpOidcLogin: ControllerHandler<
  unknown,
  unknown,
  unknown,
  { state: string; code: string }
> = async (req, res) => {
  const { state, code } = req.query
  const logMeta = {
    action: 'handleSpOidcLogin',
    state,
    code,
  }

  const nricResult = await SpOidcService.exchangeAuthCodeAndRetrieveNric(code)

  if (nricResult.isErr()) {
    logger.error({
      message: 'Failed to exchange auth code and retrieve nric',
      meta: logMeta,
      error: nricResult.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const parseResult = SpOidcService.parseState(state)
  if (parseResult.isErr()) {
    logger.error({
      message: 'Invalid SP login parameters',
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
  if (form.authType !== FormAuthType.SP) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: {
        ...logMeta,
        formAuthType: form.authType,
        endpointAuthType: FormAuthType.SP,
      },
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }

  const nric = nricResult.value
  const jwtPayload = { userName: nric, rememberMe }
  const jwtResult = await SpOidcService.createJWT(jwtPayload, cookieDuration)

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
      res.cookie(JwtName[FormAuthType.SP], jwtResult.value, {
        maxAge: cookieDuration,
        httpOnly: true,
        sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
        secure: !config.isDev,
        ...SpOidcService.getCookieSettings(),
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
