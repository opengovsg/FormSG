import { StatusCodes } from 'http-status-codes'
import { ErrorDto, GetSgidAuthUrlResponseDto } from 'shared/types'
import { SgidProfilesDto } from 'shared/types/auth'

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
        .sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message:
            'Generating SGID authentication url failed. Please try again later.',
        })
        .clearCookie(SGID_CODE_VERIFIER_COOKIE_NAME)
    })
}

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
    res.redirect(`/login?status=${status}`)
    return
  }
  if (!codeVerifier) {
    logger.error({
      message: 'Error logging in via sgID: code verifier cookie is empty',
      meta: logMeta,
    })

    const status = StatusCodes.BAD_REQUEST
    res.redirect(`/login?status=${status}`)
    return
  }
  if (!req.session) {
    logger.error({
      message: 'Error logging in user; req.session is undefined',
      meta: logMeta,
    })

    const status = StatusCodes.INTERNAL_SERVER_ERROR
    res.redirect(`/login?status=${status}`)
    return
  }

  await AuthSgidService.retrieveAccessToken(code, codeVerifier)
    .andThen(({ accessToken, sub }) =>
      AuthSgidService.retrieveUserInfo(accessToken, sub),
    )
    .map((profiles) => {
      req.session.sgid = { profiles }

      // User needs to select profile that will be used for the login
      res.redirect(`/login/select-profile`)
      return
    })
    .mapErr((error) => {
      logger.warn({
        message: 'Error occurred when trying to log in via SGID',
        meta: logMeta,
        error,
      })

      const { statusCode } = mapRouteError(error, coreErrorMessage)

      res.redirect(`/login?status=${statusCode}`)
      return
    })
}

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

  return res
    .status(StatusCodes.OK)
    .json({ profiles: req.session.sgid.profiles })
}

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
    (profile) => profile.workEmail === req.body.workEmail,
  )
  if (!selectedProfile) {
    const message = 'Error logging in via sgID: selected profile is invalid'
    logger.error({
      message,
      meta: logMeta,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({ message })
  }

  await AuthService.validateEmailDomain(selectedProfile.workEmail)
    .andThen((agency) =>
      UserService.retrieveUser(selectedProfile.workEmail, agency._id),
    )
    .map((user) => {
      // Add user info to session.
      const { _id } = user.toObject() as SessionUser
      req.session.user = { _id }
      logger.info({
        message: `Successfully logged in user ${user._id}`,
        meta: logMeta,
      })
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

  return res.status(StatusCodes.OK).json({ message: 'Ok' })
}
