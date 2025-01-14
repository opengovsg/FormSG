import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { FormAuthType } from '../../../../shared/types'
import { Environment } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

import {
  SGID_CODE_VERIFIER_COOKIE_NAME,
  SGID_COOKIE_NAME,
  SGID_MYINFO_COOKIE_NAME,
  SGID_MYINFO_NRIC_NUMBER_SCOPE,
} from './sgid.constants'
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

  const { formId, rememberMe, decodedQuery } = parsedState.value

  // For local dev, we need to specify the frontend app URL as this is different from the backend's app URL
  const redirectTargetRaw =
    process.env.NODE_ENV === Environment.Dev
      ? `${config.app.feAppUrl}/${formId}`
      : `/${formId}`
  const target = decodedQuery
    ? `${redirectTargetRaw}${decodedQuery}`
    : `${redirectTargetRaw}`

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

  if (
    form.authType !== FormAuthType.SGID &&
    form.authType !== FormAuthType.SGID_MyInfo
  ) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: {
        ...meta,
        formAuthType: form.authType,
        endpointAuthType: FormAuthType.SGID,
      },
    })
    res.cookie('isLoginError', true)
    return res.redirect(target)
  }

  const codeVerifier = req.cookies[SGID_CODE_VERIFIER_COOKIE_NAME]
  if (!codeVerifier) {
    logger.error({
      message: 'Error logging in via sgID: code verifier cookie is empty',
      meta,
    })
    res.cookie('isLoginError', true)
    return res.redirect(target)
  }
  res.clearCookie(SGID_CODE_VERIFIER_COOKIE_NAME)

  if (form.authType === FormAuthType.SGID_MyInfo) {
    const jwtResult = await SgidService.retrieveAccessToken(
      code,
      codeVerifier,
    ).andThen((data) => SgidService.createSgidMyInfoJwt(data))

    if (jwtResult.isErr()) {
      logger.error({
        message: 'Error while handling login via sgID (MyInfo)',
        meta,
        error: jwtResult.error,
      })
      res.cookie('isLoginError', true)
      return res.redirect(target)
    }

    const { maxAge, jwt, sub } = jwtResult.value
    res.cookie(SGID_MYINFO_COOKIE_NAME, JSON.stringify({ jwt, sub }), {
      maxAge,
      httpOnly: true,
      sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
      secure: !config.isDevOrTest,
      ...SgidService.getCookieSettings(),
    })
    return res.redirect(target)
  }

  const jwtResult = await SgidService.retrieveAccessToken(code, codeVerifier)
    .andThen((data) => SgidService.retrieveUserInfo(data))
    .andThen(({ data }) =>
      SgidService.createSgidSingpassJwt(
        {
          [SGID_MYINFO_NRIC_NUMBER_SCOPE]: data[SGID_MYINFO_NRIC_NUMBER_SCOPE],
        },
        rememberMe,
      ),
    )

  if (jwtResult.isErr()) {
    logger.error({
      message: 'Error while handling login via sgID',
      meta,
      error: jwtResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(target)
  }

  const { maxAge, jwt } = jwtResult.value
  res.cookie(SGID_COOKIE_NAME, jwt, {
    maxAge,
    httpOnly: true,
    sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
    secure: !config.isDevOrTest,
    ...SgidService.getCookieSettings(),
  })
  return res.redirect(target)
}
