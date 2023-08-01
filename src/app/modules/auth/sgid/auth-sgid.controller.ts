import { generatePkcePair } from '@opengovsg/sgid-client'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto, GetSgidAuthUrlResponseDto } from 'shared/types'

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

  const { codeChallenge, codeVerifier } = generatePkcePair()

  return AuthSgidService.createRedirectUrl(codeChallenge)
    .map((redirectUrl) =>
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

export const handleLogin: ControllerHandler<
  unknown,
  ErrorDto | undefined,
  unknown,
  { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query
  const codeVerifier = req.cookies[SGID_CODE_VERIFIER_COOKIE_NAME]
  res.clearCookie(SGID_CODE_VERIFIER_COOKIE_NAME)

  const logMeta = {
    action: 'handleLogin',
    code,
    state,
    ...createReqMeta(req),
  }

  const coreErrorMessage = 'Failed to log in via SGID. Please try again later.'

  let status

  if (!code || state !== SGID_LOGIN_OAUTH_STATE) {
    logger.error({
      message:
        'Error logging in with SGID: code not provided or state is incorrect.',
      meta: logMeta,
    })

    status = StatusCodes.BAD_REQUEST
  } else if (!codeVerifier) {
    logger.error({
      message: 'Error logging in via sgID: code verifier cookie is empty',
      meta: logMeta,
    })

    status = StatusCodes.BAD_REQUEST
  } else {
    await AuthSgidService.retrieveAccessToken(code, codeVerifier)
      .andThen(({ accessToken, sub }) =>
        AuthSgidService.retrieveUserInfo(accessToken, sub),
      )
      .andThen((email) =>
        AuthService.validateEmailDomain(email).andThen((agency) =>
          UserService.retrieveUser(email, agency._id),
        ),
      )
      .map((user) => {
        if (!req.session) {
          logger.error({
            message: 'Error logging in user; req.session is undefined',
            meta: logMeta,
          })

          status = StatusCodes.INTERNAL_SERVER_ERROR
          return
        }

        // Add user info to session.
        const { _id } = user.toObject() as SessionUser
        req.session.user = { _id }
        logger.info({
          message: `Successfully logged in user ${user._id}`,
          meta: logMeta,
        })

        // Redirect user to the SGID login page
        status = StatusCodes.OK
      })
      // Step 3b: Error occured in one of the steps.
      .mapErr((error) => {
        logger.warn({
          message: 'Error occurred when trying to log in via SGID',
          meta: logMeta,
          error,
        })

        const { statusCode } = mapRouteError(error, coreErrorMessage)

        status = statusCode
      })
  }

  return res.redirect(`/ogp-login?status=${status}`)
}
