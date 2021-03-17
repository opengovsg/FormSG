import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import config from '../../../config/config'
import FeatureManager, { FeatureNames } from '../../../config/feature-manager'
import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, WithForm } from '../../../types'
import { createReqMeta } from '../../utils/request'
import { BillingFactory } from '../billing/billing.factory'
import * as FormService from '../form/form.service'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { SpcpFactory } from './spcp.factory'
import { JwtName, LoginPageValidationResult } from './spcp.types'
import {
  createCorppassParsedResponses,
  createSingpassParsedResponses,
  extractFormId,
  mapRouteError,
} from './spcp.util'

const logger = createLoggerWithLabel(module)

// TODO (private #123): remove checking of form ID against CorpPass cloud test form
const spcpFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)

/**
 * Generates redirect URL to Official SingPass/CorpPass log in page
 * @param req - Express request object
 * @param res - Express response object
 */
export const handleRedirect: RequestHandler<
  ParamsDictionary,
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
  // TODO (private #123): remove checking of form ID against CorpPass cloud test form
  const payloads = target.split(',')
  const formId = extractFormId(payloads[0])
  const useCpCloud = spcpFeature.props?.cpCloudFormId === formId
  return SpcpFactory.createRedirectUrl(authType, target, esrvcId, useCpCloud)
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
  ParamsDictionary,
  LoginPageValidationResult | { message: string },
  unknown,
  {
    authType: AuthType.SP | AuthType.CP
    target: string
    esrvcId: string
  }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  const useCpCloud = spcpFeature.props?.cpCloudFormId === target
  return SpcpFactory.createRedirectUrl(authType, target, esrvcId, useCpCloud)
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
 * Adds session to returned JSON if form-filler is SPCP Authenticated
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const addSpcpSessionInfo: RequestHandler<ParamsDictionary> = async (
  req,
  res,
  next,
) => {
  const { authType, _id } = (req as WithForm<typeof req>).form
  if (authType !== AuthType.SP && authType !== AuthType.CP) return next()

  const jwtResult = SpcpFactory.extractJwt(req.cookies, authType)
  // No action needed if JWT is missing, just means user is not logged in
  if (jwtResult.isErr()) return next()

  const useCpCloud = spcpFeature.props?.cpCloudFormId === String(_id)
  return SpcpFactory.extractJwtPayload(jwtResult.value, authType, useCpCloud)
    .map(({ userName }) => {
      res.locals.spcpSession = { userName }
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Failed to verify JWT with auth client',
        meta: {
          action: 'addSpcpSessionInfo',
          ...createReqMeta(req),
        },
        error,
      })
      return next()
    })
}

/**
 * Checks if user is SPCP-authenticated before allowing submission
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const isSpcpAuthenticated: RequestHandler<ParamsDictionary> = (
  req,
  res,
  next,
) => {
  const { authType, _id } = (req as WithForm<typeof req>).form
  if (authType !== AuthType.SP && authType !== AuthType.CP) return next()

  const useCpCloud = spcpFeature.props?.cpCloudFormId === String(_id)
  return SpcpFactory.extractJwt(req.cookies, authType)
    .asyncAndThen((jwt) =>
      SpcpFactory.extractJwtPayload(jwt, authType, useCpCloud),
    )
    .map(({ userName, userInfo }) => {
      res.locals.uinFin = userName
      res.locals.userInfo = userInfo
      return next()
    })
    .mapErr((error) => {
      const { statusCode, errorMessage } = mapRouteError(error)
      logger.error({
        message: 'Failed to verify JWT with auth client',
        meta: {
          action: 'isSpcpAuthenticated',
          ...createReqMeta(req),
          authType,
        },
        error,
      })
      return res.status(statusCode).json({
        message: errorMessage,
        spcpSubmissionFailure: true,
      })
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
  ParamsDictionary,
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
  const useCpCloud = spcpFeature.props?.cpCloudFormId === String(form._id)
  const jwtResult = await SpcpFactory.getSpcpAttributes(
    SAMLart,
    destination,
    authType,
    useCpCloud,
  )
    .andThen((attributes) =>
      SpcpFactory.createJWTPayload(attributes, rememberMe, authType),
    )
    .andThen((jwtPayload) =>
      SpcpFactory.createJWT(jwtPayload, cookieDuration, authType, useCpCloud),
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

/**
 * Append additional verified responses(s) for SP and CP responses so that they show up in email response
 * @param req - Express request object
 * @param res - Express response object
 */
export const appendVerifiedSPCPResponses: RequestHandler<
  ParamsDictionary,
  unknown,
  { parsedResponses: ProcessedFieldResponse[] }
> = (req, res, next) => {
  const { form } = req as WithForm<typeof req>
  const { uinFin, userInfo } = res.locals
  switch (form.authType) {
    case AuthType.MyInfo:
    case AuthType.SP:
      req.body.parsedResponses.push(...createSingpassParsedResponses(uinFin))
      break
    case AuthType.CP:
      // Note that maskUidOnLastField() relies on the fact that userInfo is pushed in last to parsedResponses
      // TODO(#1104): Remove this comment after refactoring
      req.body.parsedResponses.push(
        ...createCorppassParsedResponses(uinFin, userInfo),
      )
      break
  }
  return next()
}
