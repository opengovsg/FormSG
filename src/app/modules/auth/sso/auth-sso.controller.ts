import { StatusCodes } from 'http-status-codes'
import { ErrorDto, GetSgidAuthUrlResponseDto } from 'shared/types'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { resolveRedirectionUrl } from '../../../utils/urls'
import { ControllerHandler } from '../../core/core.types'

import { SSO_CODE_VERIFIER_COOKIE_NAME } from './auth-sso.constants'
import { AuthSsoService, SSO_LOGIN_OAUTH_STATE } from './auth-sso.service'

const logger = createLoggerWithLabel(module)

export const login: ControllerHandler<
  unknown,
  ErrorDto | GetSgidAuthUrlResponseDto
> = async (req, res) => {
  const logMeta = {
    action: 'login',
    ...createReqMeta(req),
  }

  return AuthSsoService.createRedirectUrl()
    .map(({ redirectUrl, codeVerifier }) =>
      res
        .status(StatusCodes.OK)
        .cookie(SSO_CODE_VERIFIER_COOKIE_NAME, codeVerifier)
        .cookie('state', SSO_LOGIN_OAUTH_STATE)
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
  const { code, state, iss } = req.query // can trust on FE query
  const codeVerifier = req.cookies[SSO_CODE_VERIFIER_COOKIE_NAME]
  res.clearCookie(SSO_CODE_VERIFIER_COOKIE_NAME)

  const logMeta = {
    action: 'handleLoginCallback',
    code,
    state,
    ...createReqMeta(req),
  }

  // state checkers
  {
    if (!code || state !== SSO_LOGIN_OAUTH_STATE) {
      logger.error({
        message:
          'Error logging in with SSO: code not provided or state is incorrect.',
        meta: logMeta,
      })

      const status = StatusCodes.BAD_REQUEST
      res.redirect(resolveRedirectionUrl(`/login?status=${status}`))
      return
    }
    if (!codeVerifier) {
      logger.error({
        message: 'Error logging in via sgID: code verifier cookie is empty',
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
  }

  AuthSsoService.retrieveAccessToken(codeVerifier, state, req.originalUrl)
    .andThen((tokens) => {
      return AuthSsoService.retrieveUserInfo(tokens)
    })
    .map((userInfo) => {
      console.log('HEYY!', { userInfo })
    })
}
