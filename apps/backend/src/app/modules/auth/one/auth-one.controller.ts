import { AuthedSessionData } from 'express-session'
import { ErrorDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'

import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { resolveRedirectionUrl } from '../../../utils/urls'
import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'
import * as AuthService from '../auth.service'
import { isEmailInDomainWhitelist, mapRouteError } from '../auth.utils'

import {
  ONE_CODE_VERIFIER_COOKIE_NAME,
  ONE_NONCE_COOKIE_NAME,
  ONE_STATE_COOKIE_NAME,
  ONE_USER_DOMAIN_WHITELIST,
} from './auth-one.constants'
import { OneNotWhitelistedError } from './auth-one.errors'
import { AuthOneService } from './auth-one.service'

const logger = createLoggerWithLabel(module)

// RATIONALE: shared between res.cookie and res.clearCookie so cookies match
// when cleared. sameSite lax (not strict) — the callback is a top-level GET
// navigation from the IdP, and strict cookies are not sent on those.
export const ONE_AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: !config.isDevOrTest,
  sameSite: 'lax' as const,
  path: '/',
}

/**
 * Handler for GET /api/v3/auth/one/login endpoint.
 *
 * Starts the Authorization Code + PKCE flow against one.gov.sg and 302s the
 * browser to the IdP. This endpoint doubles as the RP's `initiate_login_uri`
 * (OpenID Connect Core §4): the one.gov.sg app launcher deep-links here with
 * an `?iss=` param, which must match the issuer we trust (ADR-0006). Absent
 * `iss` is a normal login-button click.
 */
export const handleLogin: ControllerHandler<
  unknown,
  ErrorDto | undefined,
  unknown,
  { iss?: string }
> = async (req, res) => {
  const { iss } = req.query
  const logMeta = {
    action: 'oneHandleLogin',
    iss,
    ...createReqMeta(req),
  }

  const issuerCheck = iss
    ? AuthOneService.getIssuer().andThen((issuer) =>
        issuer === iss ? okAsync(undefined) : errAsync(StatusCodes.BAD_REQUEST),
      )
    : okAsync(undefined)

  return issuerCheck
    .mapErr(() => {
      logger.error({
        message:
          'Refusing to start a one.gov.sg login flow for an untrusted iss',
        meta: logMeta,
      })
      return res.redirect(
        resolveRedirectionUrl(`/login?status=${StatusCodes.BAD_REQUEST}`),
      )
    })
    .andThen(() =>
      AuthOneService.createRedirectUrl().mapErr((error) => {
        logger.error({
          message: 'Failed to generate one.gov.sg auth url',
          meta: logMeta,
          error,
        })
        return res.redirect(
          resolveRedirectionUrl(
            `/login?status=${StatusCodes.INTERNAL_SERVER_ERROR}`,
          ),
        )
      }),
    )
    .map(({ redirectUrl, codeVerifier, state, nonce }) => {
      res.cookie(
        ONE_CODE_VERIFIER_COOKIE_NAME,
        codeVerifier,
        ONE_AUTH_COOKIE_OPTIONS,
      )
      res.cookie(ONE_STATE_COOKIE_NAME, state, ONE_AUTH_COOKIE_OPTIONS)
      res.cookie(ONE_NONCE_COOKIE_NAME, nonce, ONE_AUTH_COOKIE_OPTIONS)
      return res.redirect(redirectUrl)
    })
}

/**
 * Handler for GET /api/v3/auth/one/login/callback endpoint.
 *
 * Exchanges the authorization code for tokens (PKCE verifier + expected state
 * and nonce from single-use cookies), reads the user's identity straight from
 * the validated id_token (`sub` IS the verified gov email — ADR-0002), then
 * opens FormSG's own session with grantSource 'one'. The id_token `sid` is
 * kept on the session so a future central / back-channel logout is a config
 * change rather than a rebuild (ADR-0003).
 *
 * @return 302 to frontend /login/one holding page with a status query param
 */
export const handleLoginCallback: ControllerHandler<
  unknown,
  ErrorDto | undefined,
  unknown,
  { code: string; state: string; iss: string }
> = async (req, res) => {
  const { code, state } = req.query // can trust on FE query
  const codeVerifier = req.cookies[ONE_CODE_VERIFIER_COOKIE_NAME]
  const expectedState = req.cookies[ONE_STATE_COOKIE_NAME]
  const nonce = req.cookies[ONE_NONCE_COOKIE_NAME]

  // RATIONALE: the cookies are single-use and scoped to this one login
  // attempt. Clear before the exchange to prevent reuse, success or failure.
  res.clearCookie(ONE_CODE_VERIFIER_COOKIE_NAME, ONE_AUTH_COOKIE_OPTIONS)
  res.clearCookie(ONE_STATE_COOKIE_NAME, ONE_AUTH_COOKIE_OPTIONS)
  res.clearCookie(ONE_NONCE_COOKIE_NAME, ONE_AUTH_COOKIE_OPTIONS)

  const logMeta = {
    action: 'oneHandleLoginCallback',
    code,
    state,
    ...createReqMeta(req),
  }

  if (!code) {
    logger.error({
      message: 'Error logging in with one.gov.sg: code not provided.',
      meta: logMeta,
    })

    const status = StatusCodes.BAD_REQUEST
    res.redirect(resolveRedirectionUrl(`/login?status=${status}`))
    return
  }
  if (!codeVerifier || !expectedState || !nonce) {
    logger.error({
      message:
        'Error logging in via one.gov.sg: single-use auth cookies are missing',
      meta: logMeta,
    })

    const status = StatusCodes.BAD_REQUEST
    res.redirect(resolveRedirectionUrl(`/login?status=${status}`))
    return
  }
  if (!req.session) {
    logger.error({
      message: 'Error logging in user; req.session is undefined',
      meta: logMeta,
    })

    const status = StatusCodes.INTERNAL_SERVER_ERROR
    res.redirect(resolveRedirectionUrl(`/login?status=${status}`))
    return
  }

  const coreErrorMessage =
    'Failed to log in via one.gov.sg. Please try again later.'
  return AuthOneService.retrieveAccessToken(
    codeVerifier,
    expectedState,
    nonce,
    req.originalUrl,
  )
    .andThen((tokens) => AuthOneService.retrieveClaims(tokens))
    .andThen((claims) => {
      const userEmail = claims.email.toLowerCase()
      if (!isEmailInDomainWhitelist(userEmail, ONE_USER_DOMAIN_WHITELIST)) {
        logger.error({
          message: 'Error logging in user; email is not in domain whitelist',
          meta: logMeta,
        })

        return errAsync(new OneNotWhitelistedError())
      }

      return AuthService.validateEmailDomain(userEmail)
        .andThen((agency) => UserService.retrieveUser(userEmail, agency._id))
        .map((user) => ({ user, claims }))
    })
    .map(({ user, claims }) => {
      // Add user info to session.
      const { _id } = user.toObject() as AuthedSessionData['user']
      req.session.user = { _id, grantSource: 'one' }
      req.session.oneIdpSid = claims.sid
      logger.info({
        message: `Successfully logged in user ${user._id} via one.gov.sg`,
        meta: logMeta,
      })
      return res.redirect(
        resolveRedirectionUrl(`/login/one?status=${StatusCodes.OK}`),
      )
    })
    .mapErr((error) => {
      const message = 'Error occurred when trying to log in via one.gov.sg'
      logger.warn({
        message,
        meta: logMeta,
        error,
      })

      const { statusCode } = mapRouteError(error, coreErrorMessage)

      return res.redirect(
        resolveRedirectionUrl(`/login/one?status=${statusCode}`),
      )
    })
}
