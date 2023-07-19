import { StatusCodes } from 'http-status-codes'
import { ErrorDto, GetSgidAuthUrlResponseDto } from 'shared/types'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
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
    .map((redirectUrl) => res.status(StatusCodes.OK).send({ redirectUrl }))
    .mapErr((error) => {
      logger.error({
        message: 'Failed to generate SGID auth url',
        meta: logMeta,
        error,
      })
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message:
          'Generating SGID authentication url failed. Please try again later.',
      })
    })
}

export const handleLogin: ControllerHandler<
  unknown,
  ErrorDto | undefined,
  unknown,
  { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query

  const logMeta = {
    action: 'handleLogin',
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

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid query parameters' })
  }

  await AuthSgidService.retrieveAccessToken(code)
    .andThen(({ accessToken }) => AuthSgidService.retrieveUserInfo(accessToken))
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

        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: coreErrorMessage })
      }

      // Add user info to session.
      const { _id } = user.toObject() as SessionUser
      req.session.user = { _id }
      logger.info({
        message: `Successfully logged in user ${user._id}`,
        meta: logMeta,
      })

      // Redirect user to the SGID login page
      return res.redirect('/login/sgid')
    })
    // Step 3b: Error occured in one of the steps.
    .mapErr((error) => {
      logger.warn({
        message: 'Error occurred when trying to log in via SGID',
        meta: logMeta,
        error,
      })

      const { errorMessage, statusCode } = mapRouteError(
        error,
        coreErrorMessage,
      )

      return res.sendStatus(statusCode).json({ message: errorMessage })
    })
}
