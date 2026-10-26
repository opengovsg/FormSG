import { Response } from 'express'
import { FormAuthType } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import * as BillingService from '../billing/billing.service'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import { getMultirespondentSubmission } from '../submission/multirespondent-submission/multirespondent-submission.service'
import {
  clearCpStepBindingCookie,
  CpStepBindingExpiredError,
  getCpStepBindingCookieName,
  getMrfContinuationDestination,
  getMrfStepLoginSubmissionId,
  resolveMrfStepAuth,
  setMrfStepAuthCookie,
  verifyCpStepBinding,
} from '../submission/multirespondent-submission/step-auth'

import { getOidcService } from './spcp.oidc.service'

const logger = createLoggerWithLabel(module)

/**
 * Completes a Corppass login started for a later MRF step. The signed binding,
 * not the form's login settings, decides which submission and step the login
 * is for. Only that step's continuation cookie is set, never the global
 * Corppass cookie. The login is billed to the step's own e-service ID.
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
  const stepResult = await getMultirespondentSubmission(
    binding.submissionId,
  ).andThen((submission) => resolveMrfStepAuth(formId, submission, { binding }))
  const jwtPayloadResult = oidcService.createJWTPayload(
    attributesResult.value,
    false,
  )
  if (
    stepResult.isErr() ||
    !stepResult.value.context ||
    jwtPayloadResult.isErr() ||
    !('userInfo' in jwtPayloadResult.value)
  ) {
    logger.error({
      message: 'Corppass step login no longer matches the submission',
      meta: stepMeta,
      error: stepResult.isErr() ? stepResult.error : undefined,
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }

  // Billed like a Step 1 login: no step session unless the login is recorded.
  const { esrvcId } = stepResult.value
  const billingResult = await FormService.retrieveFullFormById(formId).andThen(
    (form) =>
      BillingService.recordLoginByForm(form, {
        authType: FormAuthType.CP,
        esrvcId: esrvcId ?? '',
      }),
  )
  if (billingResult.isErr()) {
    logger.error({
      message: 'Failed to record Corppass step login for billing',
      meta: stepMeta,
      error: billingResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(destination)
  }

  const { userName, userInfo } = jwtPayloadResult.value
  setMrfStepAuthCookie(res, {
    ...stepResult.value.context,
    userName,
    userInfo,
  })
  logger.info({
    message: 'MRF step login succeeded',
    meta: { ...stepMeta, authType: FormAuthType.CP },
  })
  return res.redirect(destination)
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
  // A later step's login whose binding cookie has gone (e.g. expired). Send
  // the respondent back to that step to log in again, never through Step 1.
  const stepLoginSubmissionId =
    authType === FormAuthType.CP
      ? getMrfStepLoginSubmissionId(destination.split('?')[1])
      : undefined
  if (stepLoginSubmissionId) {
    logger.warn({
      message: 'Corppass step login returned without its binding',
      meta: { ...logMeta, submissionId: stepLoginSubmissionId },
    })
    res.cookie('isLoginError', true)
    return res.redirect(
      getMrfContinuationDestination({
        formId,
        submissionId: stepLoginSubmissionId,
        query: destination.split('?')[1],
      }),
    )
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
