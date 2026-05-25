import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import { Environment } from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { ControllerHandler } from '../../core/core.types'
import {
  MYINFO_AUTH_CODE_COOKIE_NAME,
  MYINFO_AUTH_CODE_COOKIE_OPTIONS,
} from '../myinfo.constants'
import {
  MyInfoAuthCodeCookiePayload,
  MyInfoAuthCodeCookieState,
  MyInfoAuthCodeSuccessPayload,
} from '../myinfo.types'

import { MyInfoV5Service } from './myinfo.v5.factory'
import { decodeV5State } from './myinfo.v5.service'

const logger = createLoggerWithLabel(module)

/**
 * GET /api/v3/mi/v5/.well-known/jwks.json
 *
 * Serves the RP public JWKS so the Singpass IdP can verify our
 * client_assertion signatures and encrypt the userinfo JWE addressed to us.
 *
 * Mockpass fetches this via SP_RP_JWKS_ENDPOINT; prod Singpass requires it
 * to be reachable from the public internet at the registered URL.
 */
export const handleV5Jwks: ControllerHandler = (_req, res) => {
  res.set('cache-control', 'public, max-age=300')
  return res.status(StatusCodes.OK).json(MyInfoV5Service.getPublicJwks())
}

/**
 * Validation middleware for the v5 OAuth callback. The query shape mirrors
 * v3 (code + state) but we also accept the standard OIDC error response so
 * we can render a sensible error page rather than 500.
 */
const validateV5Login = celebrate({
  [Segments.QUERY]: Joi.alternatives().try(
    Joi.object()
      .keys({
        code: Joi.string().required(),
        state: Joi.string().required(),
      })
      .unknown(true),
    Joi.object()
      .keys({
        error: Joi.string().required(),
        'error-description': Joi.string(),
        state: Joi.string().required(),
      })
      .unknown(true),
  ),
})

type V5LoginQuery =
  | { code: string; state: string }
  | { error: string; 'error-description'?: string; state: string }

/**
 * GET /api/v3/mi/v5/login
 *
 * Receives the OAuth code from Singpass, validates the state, and forwards
 * the user back to the original form. The actual token exchange happens
 * lazily — we drop the code into the standard MyInfoAuthCode cookie so the
 * shared form-view path picks it up.
 */
export const loginToMyInfoV5: ControllerHandler<
  unknown,
  unknown,
  unknown,
  V5LoginQuery
> = (req, res) => {
  const { state } = req.query
  const logMeta = { action: 'loginToMyInfoV5', state }

  const parsed = decodeV5State(state)
  if (parsed.isErr()) {
    logger.error({
      message: 'Invalid MyInfo v5 state',
      meta: logMeta,
      error: parsed.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
  const { formId, encodedQuery } = parsed.value

  const redirectRaw =
    process.env.NODE_ENV === Environment.Dev
      ? `${config.app.feAppUrl}/${formId}`
      : `/${formId}`

  let redirectDestination = redirectRaw
  if (encodedQuery) {
    try {
      redirectDestination = `${redirectRaw}?${Buffer.from(
        encodedQuery,
        'base64',
      ).toString('utf8')}`
    } catch {
      // Fall back to default if encoded query is malformed.
    }
  }

  if ('error' in req.query) {
    logger.error({
      message: 'MyInfo v5 returned error from consent flow',
      meta: {
        ...logMeta,
        error: req.query.error,
        errorDescription: req.query['error-description'],
      },
    })
    const errorPayload: MyInfoAuthCodeCookiePayload = {
      state: MyInfoAuthCodeCookieState.Error,
    }
    res.cookie(
      MYINFO_AUTH_CODE_COOKIE_NAME,
      errorPayload,
      MYINFO_AUTH_CODE_COOKIE_OPTIONS,
    )
    return res.redirect(redirectDestination)
  }

  // The PKCE verifier stays in its cookie. The form-view handler reads BOTH
  // the auth-code cookie and the PKCE cookie when finalising the v5 flow.
  // We don't clear the PKCE cookie here — the form-view endpoint does it.
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

export const handleMyInfoV5Login = [
  validateV5Login,
  loginToMyInfoV5,
] as ControllerHandler[]
