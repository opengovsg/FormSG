import { Response } from 'express'
import { FormAuthType } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import * as BillingService from '../billing/billing.service'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import {
  checkFormIsMultirespondent,
  getMultirespondentSubmission,
} from '../submission/multirespondent-submission/multirespondent-submission.service'
import {
  clearCpStepBindingCookie,
  CpStepBindingExpiredError,
  getCpStepBindingCookieName,
  getMrfContinuationDestination,
  resolveMrfStepAuth,
  setMrfStepAuthCookie,
  verifyCpStepBinding,
} from '../submission/multirespondent-submission/step-auth'

import { getOidcService } from './spcp.oidc.service'

const logger = createLoggerWithLabel(module)

/**
 * Completes a Corppass login started for a later MRF step. The signed binding,
 * not the form's login settings, decides which submission and step the login
 * is for; only that step's continuation cookie is set, never the global jwtCp.
 */
const handleCpStepLogin = async ({
  res,
  code,
  codeVerifier,
  bindingToken,
  nonce,
  formId,
  query,
  logMeta,
}: {
  res: Response
  code: string
  codeVerifier?: string
  bindingToken: string
  nonce: string
  formId: string
  query?: string
  logMeta: { action: string } & Record<string, unknown>
}) => {
  const bindingResult = verifyCpStepBinding(bindingToken, nonce)
  if (bindingResult.isErr()) {
    const { error } = bindingResult
    if (
      error instanceof CpStepBindingExpiredError &&
      error.context.formId === formId
    ) {
      logger.warn({
        message: 'Corppass step login binding expired',
        meta: logMeta,
      })
      res.cookie('isLoginError', true)
      return res.redirect(
        getMrfContinuationDestination({
          formId,
          submissionId: error.context.submissionId,
          query,
        }),
      )
    }
    logger.error({
      message: 'Invalid Corppass step login binding',
      meta: logMeta,
      error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const binding = bindingResult.value
  if (binding.formId !== formId || binding.authType !== FormAuthType.CP) {
    logger.error({
      message: 'Corppass step login binding does not match state',
      meta: logMeta,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
  const stepMeta = {
    ...logMeta,
    submissionId: binding.submissionId,
    workflowStep: binding.workflowStep,
  }
  const destination = getMrfContinuationDestination({
    formId,
    submissionId: binding.submissionId,
    query,
  })
  const oidcService = getOidcService(FormAuthType.CP)

  const attributesResult = await oidcService.exchangeAuthCodeAndRetrieveData(
    code,
    codeVerifier,
  )
  if (attributesResult.isErr()) {
    logger.error({
      message: 'Failed to exchange auth code for Corppass step login',
      meta: stepMeta,
      error: attributesResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }

  // The step must still be the one the login was started for.
  const stepResult = await FormService.retrieveFullFormById(formId)
    .andThen(checkFormIsMultirespondent)
    .andThen((form) =>
      getMultirespondentSubmission(binding.submissionId).andThen((submission) =>
        resolveMrfStepAuth(form, submission, { binding }).map((resolved) => ({
          form,
          resolved,
        })),
      ),
    )
  if (stepResult.isErr()) {
    logger.error({
      message: 'Corppass step login no longer matches the submission',
      meta: stepMeta,
      error: stepResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }
  const { form, resolved } = stepResult.value
  const { context, login } = resolved
  const jwtPayloadResult = oidcService.createJWTPayload(
    attributesResult.value,
    false,
  )
  if (
    !context ||
    !login ||
    jwtPayloadResult.isErr() ||
    !('userInfo' in jwtPayloadResult.value)
  ) {
    logger.error({
      message: 'Corppass step login is missing identity attributes',
      meta: stepMeta,
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }
  const { userName, userInfo } = jwtPayloadResult.value

  return BillingService.recordLoginByForm(form, {
    authType: FormAuthType.CP,
    esrvcId: login.esrvcId,
  })
    .map(() => {
      setMrfStepAuthCookie(res, { ...context, userName, userInfo })
      return res.redirect(destination)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while adding Corppass step login to database',
        meta: stepMeta,
        error,
      })
      res.cookie('isLoginError', true)
      return res.redirect(destination)
    })
}

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
  { state: string; code: string; forwarded?: string }
> = (authType) => async (req, res) => {
  const { state, code } = req.query
  const logMeta = {
    action: 'handleSpcpOidcLogin',
    state,
    hasCode: !!code,
    authType,
  }

  const oidcService = getOidcService(authType)

  // State must be parsed before the code_verifier is read: the nonce it carries
  // is what scopes the verifier cookie to this login attempt.
  const parseResult = oidcService.parseState(state)
  if (parseResult.isErr()) {
    logger.error({
      message: 'Invalid login parameters',
      meta: logMeta,
      error: parseResult.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
  const { formId, destination, rememberMe, cookieDuration, nonce } =
    parseResult.value

  const codeVerifier = oidcService.extractCodeVerifier(req.cookies, nonce)
  res.clearCookie(
    oidcService.getCodeVerifierCookieName(nonce),
    oidcService.getCodeVerifierCookieOptions(),
  )

  // A Corppass login for a later MRF step carries a nonce-scoped binding.
  const bindingToken: unknown =
    authType === FormAuthType.CP && nonce
      ? req.cookies?.[getCpStepBindingCookieName(nonce)]
      : undefined
  if (nonce && typeof bindingToken === 'string' && bindingToken) {
    clearCpStepBindingCookie(res, nonce)
    return handleCpStepLogin({
      res,
      code,
      codeVerifier,
      bindingToken,
      nonce,
      formId,
      query: destination.split('?')[1],
      logMeta,
    })
  }

  const result = await oidcService.exchangeAuthCodeAndRetrieveData(
    code,
    codeVerifier,
  )

  if (result.isErr()) {
    logger.error({
      message: 'Failed to exchange auth code and retrieve nric',
      meta: logMeta,
      error: result.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
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
        secure: !config.isDevOrTest,
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
