import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { AuthType } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

import { SgidService } from './sgid.service'

const logger = createLoggerWithLabel(module)

export const handleLogin: ControllerHandler<
  ParamsDictionary,
  unknown,
  unknown,
  { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query
  const meta = { action: 'handleLogin', code, state }

  const parsedState = SgidService.parseState(state)

  if (parsedState.isErr()) {
    logger.error({
      message: 'Invalid state sent from sgID',
      meta,
      error: parsedState.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const { formId, rememberMe } = parsedState.value
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.error({
      message: 'Form not found',
      meta,
      error: formResult.error,
    })
    return res.sendStatus(StatusCodes.NOT_FOUND)
  }

  const form = formResult.value
  if (form.authType !== AuthType.SGID) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: {
        ...meta,
        formAuthType: form.authType,
        endpointAuthType: AuthType.SGID,
      },
    })
    res.cookie('isLoginError', true)
    return res.redirect(`/${formId}`)
  }

  const jwtResult = await SgidService.retrieveAccessToken(code)
    .andThen((data) => SgidService.retrieveUserInfo(data))
    .andThen(({ data }) => SgidService.createJwt(data, rememberMe))

  if (jwtResult.isErr()) {
    logger.error({
      message: 'Error while handling login via sgID',
      meta,
      error: jwtResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(`/${formId}`)
  }

  const { maxAge, jwt } = jwtResult.value
  res.cookie('jwtSgid', jwt, {
    maxAge,
    httpOnly: true,
    sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
    secure: !config.isDev,
    ...SgidService.getCookieSettings(),
  })
  return res.redirect(`/${formId}`)
}
