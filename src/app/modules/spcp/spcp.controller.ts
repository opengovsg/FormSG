/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosError } from 'axios'
import { createPrivateKey } from 'crypto'
import fs from 'fs'
import { StatusCodes } from 'http-status-codes'
import { SignJWT } from 'jose'
import jwkToPem from 'jwk-to-pem'
import { TokenSet } from 'openid-client'

import { FormAuthType } from '../../../../shared/types'
import config from '../../config/config'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'
import * as BillingService from '../billing/billing.service'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

import { SigningKey } from './spcp.oidc.client.types'
import { getOidcService } from './spcp.oidc.service'
import { isSigningKey } from './spcp.oidc.util'

const logger = createLoggerWithLabel(module)

/**
 * Higher-order function which returns an Express handler to handle Singpass
 * and Corppass OIDC login requests.
 * @param authType 'SP' or 'CP'
 */
export const handleSpcpOidcLogin: (
  authType: FormAuthType.SP | FormAuthType.CP,
) => ControllerHandler<
  unknown,
  unknown,
  unknown,
  { state: string; code: string }
> = (authType) => async (req, res) => {
  const { state, code } = req.query
  const logMeta = {
    action: 'handleSpcpOidcLogin',
    state,
    code,
    authType,
  }

  const oidcService = getOidcService(authType)

  /* REMOVE */

  // // Create client assertion
  // const rpSecretJwks = JSON.parse(
  //   fs.readFileSync(spcpMyInfoConfig.spOidcRpJwksSecretPath).toString(),
  // )

  // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // //@ts-ignore
  // const secretKeys = rpSecretJwks.keys.map((jwk) => {
  //   const cryptoKeys = {
  //     kid: jwk.kid,
  //     use: jwk.use,
  //     alg: jwk.alg,
  //     // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
  //     // TODO (#4021): load JWK directly after node upgrade
  //     key: createPrivateKey(jwkToPem(jwk, { private: true })),
  //   }

  //   return cryptoKeys
  // })

  // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // //@ts-ignore
  // const signingKeyResult = secretKeys.filter((key): key is SigningKey =>
  //   isSigningKey(key),
  // )[0]

  // const clientAssertion = await new SignJWT({
  //   iss: 'rpClientId',
  //   aud: 'http://localhost:5156/singpass/v2',
  //   sub: 'rpClientId',
  // })
  //   .setProtectedHeader({
  //     typ: 'JWT',
  //     alg: signingKeyResult.alg,
  //     kid: signingKeyResult.kid,
  //   })
  //   .setIssuedAt()
  //   .setExpirationTime('60s')
  //   .sign(signingKeyResult.key)

  // // Construct request body. It is necessary to stringify the body because
  // // SP/CP OIDC requires content type to be application/x-www-form-urlencoded
  // const body = new URLSearchParams({
  //   grant_type: 'authorization_code',
  //   redirect_uri: 'http://localhost:5000/api/v3/singpass/login',
  //   code,
  //   client_assertion_type:
  //     'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  //   client_assertion: clientAssertion,
  //   client_id: 'rpClientId',
  // }).toString()

  // try {
  //   await axios.post<TokenSet>(
  //     'http://localhost:5156/singpass/v2/token',
  //     body,
  //     {
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //     },
  //   )
  // } catch (err) {
  //   if (err instanceof AxiosError)
  //     return res
  //       .status(StatusCodes.IM_A_TEAPOT)
  //       .send(JSON.stringify(err.response))
  // }

  /* REMOVE */

  const result = await oidcService.exchangeAuthCodeAndRetrieveData(code)

  if (result.isErr()) {
    logger.error({
      message: 'Failed to exchange auth code and retrieve nric',
      meta: logMeta,
      error: result.error,
    })
    // return res.sendStatus(StatusCodes.BAD_REQUEST)
    return res.status(StatusCodes.IM_A_TEAPOT).send(result.error)
  }

  const parseResult = oidcService.parseState(state)
  if (parseResult.isErr()) {
    logger.error({
      message: 'Invalid login parameters',
      meta: logMeta,
      error: parseResult.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
  const { formId, destination, rememberMe, cookieDuration } = parseResult.value
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.error({
      message: 'Form not found',
      meta: logMeta,
      error: formResult.error,
    })
    return res.sendStatus(StatusCodes.NOT_FOUND)
  }
  const form = formResult.value
  if (form.authType !== authType) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: {
        ...logMeta,
        formAuthType: form.authType,
        endpointAuthType: authType,
      },
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }

  const attributes = result.value
  const jwtResult = await oidcService
    .createJWTPayload(attributes, rememberMe)
    .asyncAndThen((jwtPayload) =>
      oidcService.createJWT(jwtPayload, cookieDuration),
    )

  if (jwtResult.isErr()) {
    logger.error({
      message: 'Error creating JWT',
      meta: logMeta,
      error: jwtResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }

  return BillingService.recordLoginByForm(form)
    .map(() => {
      res.cookie(oidcService.jwtName, jwtResult.value, {
        maxAge: cookieDuration,
        httpOnly: true,
        sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
        secure: !config.isDev,
        ...oidcService.getCookieSettings(),
      })
      return res.redirect(destination)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while adding login to database',
        meta: logMeta,
        error,
      })
      res.cookie('isLoginError', true)
      return res.redirect(destination)
    })
}
