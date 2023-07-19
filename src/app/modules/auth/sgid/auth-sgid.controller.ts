import { StatusCodes } from 'http-status-codes'
import { okAsync } from 'neverthrow'

import { ControllerHandler } from '../../core/core.types'
import * as UserService from '../../user/user.service'
import * as AuthService from '../auth.service'
import { SessionUser } from '../auth.types'

import { SgidService } from './auth-sgid.service'

export const generateAuthUrl: ControllerHandler = async (req, res) => {
  return res
    .status(200)
    .send({ redirectUrl: SgidService.createRedirectUrl().url })
}

export const handleLogin: ControllerHandler = async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const { code } = req.query

  await SgidService.retrieveAccessToken(code)
    .andThen((data) => SgidService.retrieveUserInfo(data))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    .andThen(() => okAsync(data['publicofficerinfo.work_email']))
    .andThen((email) =>
      AuthService.validateEmailDomain(email).andThen((agency) =>
        okAsync({
          email,
          agency,
        }),
      ),
    )
    .andThen(({ email, agency }) => UserService.retrieveUser(email, agency._id))
    .map((user) => {
      if (!req.session) {
        return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      }

      // Add user info to session.
      const { _id } = user.toObject() as SessionUser
      req.session.user = { _id }

      return res.redirect('/dashboard')
    })
    // Step 3b: Error occured in one of the steps.
    .mapErr(() => {
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
    })
}
