import { celebrate, Joi, Segments } from 'celebrate'
import { Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { Environment } from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { ControllerHandler } from '../../core/core.types'

import {
  MYINFO_FAPI_SESSION_COOKIE_NAME,
  MYINFO_FAPI_SESSION_MAX_AGE_MS,
} from './myinfo.fapi.constants'
import { exchangeCallback } from './myinfo.fapi.service'
import getMyInfoFapiSessionModel, {
  MyInfoFapiClaimOutcome,
  MyInfoFapiRedirectTarget,
} from './myinfo.fapi.session.model'

const logger = createLoggerWithLabel(module)
const MyInfoFapiSession = getMyInfoFapiSessionModel(mongoose)

const cookieIdentity = {
  signed: true,
  httpOnly: true,
  secure: !config.isDevOrTest,
  sameSite: 'lax' as const, // cannot use strict for cross-site redirects
}

type CallbackQuery = {
  state: string
  iss?: string
}
type MyInfoFapiLoginQueryParams =
  | (CallbackQuery & { code: string })
  | (CallbackQuery & { error: string; error_description?: string })

export const setMyInfoFapiSessionCookie = (
  res: Response,
  sessionId: string,
): void => {
  res.cookie(MYINFO_FAPI_SESSION_COOKIE_NAME, sessionId, {
    ...cookieIdentity,
    maxAge: MYINFO_FAPI_SESSION_MAX_AGE_MS,
  })
}

export const clearMyInfoFapiSessionCookie = (res: Response): void => {
  res.clearCookie(MYINFO_FAPI_SESSION_COOKIE_NAME, cookieIdentity)
}

const callbackQuery = {
  state: Joi.string().required(),
  iss: Joi.string().optional(), // follows from discovery endpoint
}

const validateMyInfoFapiLogin = celebrate({
  [Segments.QUERY]: Joi.alternatives().try(
    Joi.object()
      .keys({ ...callbackQuery, code: Joi.string().required() })
      .unknown(true), // code callback
    Joi.object()
      .keys({
        ...callbackQuery,
        error: Joi.string().required(),
        error_description: Joi.string().optional(),
      })
      .unknown(true), // error callback
  ),
})

/**
 * Exchanges the Singpass authorization code for tokens and redirects to the form.
 * The code is single-use, expires in ~60 seconds, and is bound to a DPoP key
 * that only the session document holds, so the exchange happens here rather
 * than on form load. Failures mark the session `failed` before redirecting,
 * so form load raises ErrorCode.myInfo; a session that never reaches this
 * callback at all is left `pending`, which form load treats as no attempt
 * having been made rather than a failure.
 */
export const loginToMyInfoFapi: ControllerHandler<
  unknown,
  unknown,
  unknown,
  MyInfoFapiLoginQueryParams
> = async (req, res) => {
  const logMeta = { action: 'loginToMyInfoFapi' }
  const sessionId: unknown =
    req.signedCookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]

  if (typeof sessionId !== 'string' || !sessionId) {
    logger.error({
      message: 'MyInfo FAPI callback without a session cookie',
      meta: logMeta,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const session = await MyInfoFapiSession.loadForCallback(sessionId).catch(
    (error) => {
      logger.error({
        message: 'Failed to load MyInfo FAPI session',
        meta: logMeta,
        error,
      })
      return null
    },
  )

  if (!session) {
    logger.error({
      message: 'MyInfo FAPI session not found or expired',
      meta: logMeta,
    })
    clearMyInfoFapiSessionCookie(res)
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const destination = redirectDestination(session.target)
  const formMeta = { ...logMeta, formId: session.target.formId }

  // One cookie slot holds one login, so a second login in another tab
  // overwrites the first. A callback that belongs to the overwritten login
  // must not resolve the session now in the cookie, or that form reports a
  // failure for a login it never started.
  if (
    session.phase === 'pending' &&
    session.exchange.state !== req.query.state
  ) {
    logger.warn({
      message: 'MyInfo FAPI callback state does not match the session cookie',
      meta: formMeta,
    })
    return res.redirect(destination)
  }

  if ('error' in req.query) {
    logger.error({
      message: 'Singpass returned an error from the MyInfo FAPI consent flow',
      meta: {
        ...formMeta,
        error: req.query.error,
        errorDescription: req.query.error_description, // logged but never rendered
      },
    })
    await recordFailure(sessionId, formMeta)
    return res.redirect(destination)
  }

  // Duplicate callback (RBI forwarding race or a double click)
  // Winner holds valid token, both requests share the cookie, so leave it.
  if (session.phase === 'exchanged') {
    logger.info({
      message:
        'Duplicate MyInfo FAPI callback, session already exchanged with valid token',
      meta: formMeta,
    })
    return res.redirect(destination)
  }

  const exchangeResult = await exchangeCallback({
    code: {
      code: req.query.code,
      state: req.query.state,
      iss: req.query.iss,
    },
    session: session.exchange,
  })

  if (exchangeResult.isErr()) {
    logger.error({
      message: 'MyInfo FAPI login error',
      meta: formMeta,
      error: exchangeResult.error,
    })
    await recordFailure(sessionId, formMeta)
    return res.redirect(destination)
  }

  let outcome: MyInfoFapiClaimOutcome
  try {
    outcome = await MyInfoFapiSession.markExchanged(
      sessionId,
      exchangeResult.value,
    )
  } catch (error) {
    // Best-effort record the failed exchange before redirecting to the form.
    logger.error({
      message: 'Failed to record MyInfo FAPI token exchange',
      meta: formMeta,
      error,
    })
    await recordFailure(sessionId, formMeta)
    return res.redirect(destination)
  }

  if (outcome === 'notFound') {
    // The session expired (TTL) while the respondent was on the Singpass
    // screens, so the tokens have nowhere to go and form load will see no
    // attempt at all rather than a failure.
    logger.error({
      message: 'MyInfo FAPI session was gone before the tokens could be stored',
      meta: formMeta,
    })
    return res.redirect(destination)
  }

  logger.info({
    message: 'Completed MyInfo FAPI token exchange',
    meta: { ...formMeta, outcome },
  })

  return res.redirect(destination)
}

/**
 * Best-effort marks the session as failed so form load can raise
 * ErrorCode.myInfo. A write failure is logged and leaves the session unchanged.
 */
const recordFailure = (
  sessionId: string,
  meta: { action: string; formId: string },
): Promise<void> =>
  MyInfoFapiSession.markFailed(sessionId).catch((error) => {
    logger.error({
      message: 'Failed to record MyInfo FAPI login failure',
      meta,
      error,
    })
  })

/**
 * Form path to send the respondent to after the callback.
 * Uses encodedQuery stored in MongoDB to reconstruct the original query string.
 * Returns the base URL if no encodedQuery is present.
 */
const redirectDestination = ({
  formId,
  encodedQuery,
}: MyInfoFapiRedirectTarget): string => {
  const origin =
    process.env.NODE_ENV === Environment.Dev ? config.app.feAppUrl : ''
  const base = `${origin}/${formId}`
  if (!encodedQuery) {
    return base
  }
  try {
    return `${base}?${Buffer.from(encodedQuery, 'base64').toString('utf8')}`
  } catch {
    return base
  }
}

/**
 * Validates the callback query and handles the callback from Singpass.
 * Mounted at GET /mi/fapi/login after authCallbackForwardingMiddleware.
 */
export const handleMyInfoFapiLogin = [
  validateMyInfoFapiLogin,
  loginToMyInfoFapi,
] as ControllerHandler[]
