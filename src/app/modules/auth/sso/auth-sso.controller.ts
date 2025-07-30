import { StatusCodes } from 'http-status-codes'
import { errAsync } from 'neverthrow'
import { ErrorDto, GetSsoAuthUrlResponseDto } from 'shared/types'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { resolveRedirectionUrl } from '../../../utils/urls'
import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'
import * as AuthService from '../auth.service'
import { SessionUser } from '../auth.types'
import { isEmailInDomainWhitelist, mapRouteError } from '../auth.utils'

import {
  SSO_CODE_VERIFIER_COOKIE_NAME,
  SSO_NONCE_NAME,
  SSO_USER_DOMAIN_WHITELIST,
} from './auth-sso.constants'
import { SsoNotWhitelistedError } from './auth-sso.errors'
import { AuthSsoService } from './auth-sso.service'

const logger = createLoggerWithLabel(module)

export const login: ControllerHandler<
  unknown,
  ErrorDto | GetSsoAuthUrlResponseDto
> = async (req, res) => {
  const logMeta = {
    action: 'login',
    ...createReqMeta(req),
  }

  return AuthSsoService.createRedirectUrl()
    .map(({ redirectUrl, codeVerifier, nonce }) =>
      res
        .status(StatusCodes.OK)
        .cookie(SSO_CODE_VERIFIER_COOKIE_NAME, codeVerifier)
        .cookie(SSO_NONCE_NAME, nonce)
        .send({ redirectUrl }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Failed to generate SSO auth url',
        meta: logMeta,
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message:
            'Generating SSO authentication url failed. Please try again later.',
        })
        .clearCookie(SSO_CODE_VERIFIER_COOKIE_NAME)
    })
}

/**
 * Handler for GET /api/v3/auth/sso/login/callback endpoint.
 *
 * @return 200 with redirect to frontend /login/callback if there are no errors
 * @return 400 when code or state is not provided, or state is incorrect
 * @return 500 when processing the code verifier cookie fails, or when an unknown error occurs
 */
export const handleLoginCallback: ControllerHandler<
  unknown,
  ErrorDto | undefined,
  unknown,
  { code: string; state: string; iss: string }
> = async (req, res) => {
  const { code, state } = req.query // can trust on FE query
  const codeVerifier = req.cookies[SSO_CODE_VERIFIER_COOKIE_NAME]
  const nonce = req.cookies[SSO_NONCE_NAME]
  res.clearCookie(SSO_CODE_VERIFIER_COOKIE_NAME)
  res.clearCookie(SSO_NONCE_NAME)

  const logMeta = {
    action: 'handleSsoLoginCallback',
    code,
    state,
    ...createReqMeta(req),
  }

  if (!code) {
    logger.error({
      message: 'Error logging in with SSO: code not provided.',
      meta: logMeta,
    })

    const status = StatusCodes.BAD_REQUEST
    res.redirect(resolveRedirectionUrl(`/login?status=${status}`))
    return
  }
  if (!codeVerifier) {
    logger.error({
      message: 'Error logging in via sso: code verifier cookie is empty',
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

  const coreErrorMessage = 'Failed to log in via SSO. Please try again later.'
  AuthSsoService.retrieveAccessToken(codeVerifier, nonce, req.originalUrl)
    .andThen((tokens) => AuthSsoService.retrieveUserInfo(tokens))
    .andThen((userInfo) => {
      const userEmail = userInfo.email.toLowerCase()
      if (!isEmailInDomainWhitelist(userEmail, SSO_USER_DOMAIN_WHITELIST)) {
        logger.error({
          message: 'Error logging in user; email is not in domain whitelist',
          meta: logMeta,
        })

        return errAsync(new SsoNotWhitelistedError())
      }

      return AuthService.validateEmailDomain(userEmail).andThen((agency) =>
        UserService.retrieveUser(userEmail, agency._id),
      )
    })
    .map((user) => {
      // Add user info to session.
      const { _id } = user.toObject() as SessionUser
      req.session.user = { _id }
      logger.info({
        message: `Successfully logged in user ${user._id}`,
        meta: logMeta,
      })
      return res.redirect(
        resolveRedirectionUrl(`/login?status=${StatusCodes.OK}`),
      )
    })
    .mapErr((error) => {
      const message = 'Error occurred when trying to log in via SSO'
      logger.warn({
        message,
        meta: logMeta,
        error,
      })

      const { statusCode } = mapRouteError(error, coreErrorMessage)

      return res.redirect(resolveRedirectionUrl(`/login?status=${statusCode}`))
    })
}
