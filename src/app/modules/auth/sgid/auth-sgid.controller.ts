import { StatusCodes } from 'http-status-codes'
import { ErrorDto, GetSgidAuthUrlResponseDto } from 'shared/types'
import { SgidProfilesDto } from 'shared/types/auth'

import { resolveRedirectionUrl } from '../../../../app/utils/urls'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
import { SGID_CODE_VERIFIER_COOKIE_NAME } from '../../sgid/sgid.constants'
import * as UserService from '../../user/user.service'
import * as AuthService from '../auth.service'
import { SessionUser } from '../auth.types'
import { mapRouteError } from '../auth.utils'

import { AuthSgidService, SGID_LOGIN_OAUTH_STATE } from './auth-sgid.service'

const logger = createLoggerWithLabel(module)

export const generateAuthUrl: ControllerHandler<
  unknown,
  ErrorDto | GetSgidAuthUrlResponseDto
> = async (req, res) => {
  const logMeta = {
    action: 'generateAuthUrl',
    ...createReqMeta(req),
  }

  return AuthSgidService.createRedirectUrl()
    .map(({ redirectUrl, codeVerifier }) =>
      res
        .status(StatusCodes.OK)
        .cookie(SGID_CODE_VERIFIER_COOKIE_NAME, codeVerifier)
        .send({ redirectUrl }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Failed to generate SGID auth url',
        meta: logMeta,
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message:
            'Generating SGID authentication url failed. Please try again later.',
        })
        .clearCookie(SGID_CODE_VERIFIER_COOKIE_NAME)
    })
}

/**
 * Handler for GET /api/v3/auth/sgid/login/callback endpoint.
 *
 * @return 200 with redirect to frontend /login/callback if there are no errors
 * @return 400 when code or state is not provided, or state is incorrect
 * @return 500 when processing the code verifier cookie fails, or when an unknown error occurs
 */
export const handleLoginCallback: ControllerHandler<
  unknown,
  ErrorDto | undefined,
  unknown,
  { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query
  const codeVerifier = req.cookies[SGID_CODE_VERIFIER_COOKIE_NAME]
  res.clearCookie(SGID_CODE_VERIFIER_COOKIE_NAME)

  const logMeta = {
    action: 'handleLoginCallback',
    code,
    state,
    ...createReqMeta(req),
  }

  const coreErrorMessage = 'Failed to log in via SGID. Please try again later.'

  if (!code || state !== SGID_LOGIN_OAUTH_STATE) {
    logger.error({
      message:
        'Error logging in with SGID: code not provided or state is incorrect.',
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

  await AuthSgidService.retrieveAccessToken(code, codeVerifier)
    .andThen(({ accessToken, sub }) =>
      AuthSgidService.retrieveUserInfo(accessToken, sub),
    )
    .map((profiles) => {
      // expire profiles after 5 minutes to avoid situations where login-jacking when
      // the previous user navigated away without selecting a profile
      req.session.sgid = { profiles, expiry: Date.now() + 1000 * 60 * 5 }

      // User needs to select profile that will be used for the login
      res.redirect(resolveRedirectionUrl(`/login/select-profile`))
      return
    })
    .mapErr((error) => {
      logger.warn({
        message: 'Error occurred when trying to log in via SGID',
        meta: logMeta,
        error,
      })

      const { statusCode } = mapRouteError(error, coreErrorMessage)

      res.redirect(resolveRedirectionUrl(`/login?status=${statusCode}`))
      return
    })
}

/**
 * Handler for GET /api/v3/auth/sgid/profiles endpoint.
 *
 * @return 200 with list of profiles
 * @return 400 when session or profile is invalid
 * @return 401 when session has expired
 */
export const getProfiles: ControllerHandler<
  unknown,
  SgidProfilesDto,
  unknown
> = async (req, res) => {
  const logMeta = {
    action: 'getProfiles',
    ...createReqMeta(req),
  }
  if (!req.session) {
    logger.error({
      message: 'Error logging in via sgID: session is invalid',
      meta: logMeta,
    })
    return res.status(StatusCodes.BAD_REQUEST).send()
  }

  if (!req.session.sgid?.profiles) {
    logger.error({
      message: 'Error logging in via sgID: profile is invalid',
      meta: logMeta,
    })
    return res.status(StatusCodes.BAD_REQUEST).send()
  }

  if (req.session.sgid.expiry < Date.now()) {
    logger.info({
      message: 'Error logging in via sgID: session has expired',
      meta: logMeta,
    })
    res.redirect(StatusCodes.UNAUTHORIZED, resolveRedirectionUrl(`/login`))
    return
  }

  return res
    .status(StatusCodes.OK)
    .json({ profiles: req.session.sgid.profiles })
}

/**
 * Handler for POST /api/v3/auth/sgid/profiles endpoint.
 *
 * @return 200 when OTP has been been successfully sent
 * @return 400 when session, profile, or workEmail is invalid
 * @return 401 when email domain is not whitelisted
 * @return 500 when unknown errors occurs during email validation, or creating the new account
 */
export const setProfile: ControllerHandler<
  unknown,
  { message: string } | ErrorDto,
  { workEmail: string }
> = async (req, res) => {
  const logMeta = {
    action: 'setProfile',
    ...createReqMeta(req),
  }

  const coreErrorMessage = 'Failed to log in via SGID. Please try again later.'

  if (!req.session) {
    const message = 'Error logging in via sgID: session is invalid'
    logger.error({
      message,
      meta: logMeta,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({ message })
  }

  if (!req.session.sgid?.profiles) {
    const message = 'Error logging in via sgID: profile is invalid'
    logger.error({
      message,
      meta: logMeta,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({ message })
  }

  const selectedProfile = req.session.sgid.profiles.find(
    (profile) => profile.work_email === req.body.workEmail,
  )
  if (!selectedProfile) {
    const message = 'Error logging in via sgID: selected profile is invalid'
    logger.error({
      message,
      meta: logMeta,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({ message })
  }

  return AuthService.validateEmailDomain(selectedProfile.work_email)
    .andThen((agency) =>
      UserService.retrieveUser(selectedProfile.work_email, agency._id),
    )
    .map((user) => {
      // Add user info to session.
      const { _id } = user.toObject() as SessionUser
      req.session.user = { _id }
      logger.info({
        message: `Successfully logged in user ${user._id}`,
        meta: logMeta,
      })
      return res.status(StatusCodes.OK).json({ message: 'Ok' })
    })
    .mapErr((error) => {
      const message = 'Error occurred when trying to log in via SGID'
      logger.warn({
        message,
        meta: logMeta,
        error,
      })

      const { statusCode } = mapRouteError(error, coreErrorMessage)

      return res.status(statusCode).json({ message })
    })
}
