import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { Environment } from '../../../../types'
import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { ControllerHandler } from '../../core/core.types'

import {
  MYINFO_FAPI_SESSION_CLEAR_COOKIE_OPTIONS,
  MYINFO_FAPI_SESSION_COOKIE_NAME,
} from './myinfo.fapi.constants'
import { exchangeCallback } from './myinfo.fapi.service'
import getMyInfoFapiSessionModel, {
  MyInfoFapiClaimOutcome,
  MyInfoFapiRedirectTarget,
} from './myinfo.fapi.session.model'

const logger = createLoggerWithLabel(module)
const MyInfoFapiSession = getMyInfoFapiSessionModel(mongoose)

/**
 * `iss` is optional here. Whether it is required is a property of the
 * discovered server metadata, and openid-client enforces it from there.
 */
const callbackQuery = {
  state: Joi.string().required(),
  iss: Joi.string().optional(),
  forwarded: Joi.string().optional(),
}

/**
 * Query must be either a code callback or a Singpass error callback.
 */
const validateMyInfoFapiLogin = celebrate({
  [Segments.QUERY]: Joi.alternatives().try(
    Joi.object()
      .keys({ ...callbackQuery, code: Joi.string().required() })
      .unknown(true),
    Joi.object()
      .keys({
        ...callbackQuery,
        error: Joi.string().required(),
        error_description: Joi.string().optional(),
      })
      .unknown(true),
  ),
})

type CallbackQuery = {
  state: string
  iss?: string
  forwarded?: string
}

type MyInfoFapiLoginQueryParams =
  | (CallbackQuery & { code: string })
  | (CallbackQuery & { error: string; error_description?: string })

/**
 * Exchanges the Singpass authorization code for tokens and redirects to the form.
 * The code is single-use, expires in ~60 seconds, and is bound to a DPoP key
 * that only the session document holds, so the exchange happens here rather
 * than on form load. Failures still redirect to the form with the session
 * cookie intact, so form load raises ErrorCode.myInfo — the same outcome as a
 * spent v3 auth code.
 */
export const loginToMyInfoFapi: ControllerHandler<
  unknown,
  unknown,
  unknown,
  MyInfoFapiLoginQueryParams
> = async (req, res) => {
  const sessionId: unknown =
    req.signedCookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]

  if (typeof sessionId !== 'string' || !sessionId) {
    logger.error({
      message: 'MyInfo FAPI callback without a session cookie',
      meta: { action: 'loginToMyInfoFapi' },
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const logMeta = { action: 'loginToMyInfoFapi', sessionId }

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
    res.clearCookie(
      MYINFO_FAPI_SESSION_COOKIE_NAME,
      MYINFO_FAPI_SESSION_CLEAR_COOKIE_OPTIONS,
    )
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const destination = redirectDestination(session.target)
  const formMeta = { ...logMeta, formId: session.target.formId }

  if ('error' in req.query) {
    logger.error({
      message: 'Singpass returned an error from the MyInfo FAPI consent flow',
      meta: {
        ...formMeta,
        error: req.query.error,
        // Logged but never rendered: Singpass warns this is a spoofing vector.
        errorDescription: req.query.error_description,
      },
    })
    return res.redirect(destination)
  }

  // Duplicate callback (RBI forwarding race or a double click). The winner
  // already holds a valid token; both requests share the cookie, so leave it.
  if (session.phase === 'exchanged') {
    logger.info({
      message: 'Duplicate MyInfo FAPI callback, session already exchanged',
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
    return res.redirect(destination)
  }

  const outcome: MyInfoFapiClaimOutcome = await MyInfoFapiSession.markExchanged(
    sessionId,
    exchangeResult.value,
  ).catch((error) => {
    logger.error({
      message: 'Failed to record MyInfo FAPI token exchange',
      meta: logMeta,
      error,
    })
    return 'notFound'
  })

  logger.info({
    message: 'Completed MyInfo FAPI token exchange',
    meta: { ...formMeta, outcome },
  })
  return res.redirect(destination)
}

/**
 * Handles the redirect from Singpass after the respondent has consented.
 * Mounted at GET /mi/fapi/login after authCallbackForwardingMiddleware.
 */
export const handleMyInfoFapiLogin = [
  validateMyInfoFapiLogin,
  loginToMyInfoFapi,
] as ControllerHandler[]

/**
 * Form path to send the respondent to after the callback.
 * @param formId - The form ID.
 * @param encodedQuery - The encoded query.
 * @returns The redirect destination.
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
