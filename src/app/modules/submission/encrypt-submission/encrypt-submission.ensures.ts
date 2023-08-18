import { StatusCodes } from 'http-status-codes'

import { CaptchaTypes } from '../../../../../shared/types/captcha'
import { IPopulatedForm } from '../../../../types'
import * as CaptchaService from '../../../services/captcha/captcha.service'
import * as TurnstileService from '../../../services/turnstile/turnstile.service'
import { Middleware } from '../../../utils/pipeline-middleware'
import { getRequestIp } from '../../../utils/request'
import * as FormService from '../../form/form.service'

import { logger } from './encrypt-submission.controller'
import { mapRouteError } from './encrypt-submission.utils'

type FormSubmissionPipelineContext = {
  req: any
  res: any
  logMeta: { [other: string]: any; action: string }
  form: IPopulatedForm
}

export const ensureFormWithinSubmissionLimits: Middleware<
  FormSubmissionPipelineContext
> = async ({ logMeta, res, form }, next) => {
  const formSubmissionLimitResult =
    await FormService.checkFormSubmissionLimitAndDeactivateForm(form)
  if (formSubmissionLimitResult.isErr()) {
    logger.warn({
      message:
        'Attempt to submit form which has just reached submission limits',
      meta: logMeta,
      error: formSubmissionLimitResult.error,
    })
    const { statusCode } = mapRouteError(formSubmissionLimitResult.error)
    return res.status(statusCode).json({
      message: form.inactiveMessage,
    })
  }
  return next()
}

export const ensureValidCaptcha: Middleware<
  FormSubmissionPipelineContext
> = async ({ form, req, logMeta, res }, next) => {
  // Check if respondent is a GSIB user
  const isIntranetUser = FormService.checkIsIntranetFormAccess(
    getRequestIp(req),
    form,
  )

  if (isIntranetUser) {
    return next()
  }

  if (form.hasCaptcha) {
    switch (req.query.captchaType) {
      case CaptchaTypes.Turnstile: {
        const turnstileResult = await TurnstileService.verifyTurnstileResponse(
          req.query.captchaResponse,
          getRequestIp(req),
        )
        if (turnstileResult.isErr()) {
          logger.error({
            message: 'Error while verifying turnstile',
            meta: logMeta,
            error: turnstileResult.error,
          })
          const { errorMessage, statusCode } = mapRouteError(
            turnstileResult.error,
          )
          return res.status(statusCode).json({ message: errorMessage })
        }
        break
      }
      case CaptchaTypes.Recaptcha: // fallthrough, defaults to reCAPTCHA
      default: {
        const captchaResult = await CaptchaService.verifyCaptchaResponse(
          req.query.captchaResponse,
          getRequestIp(req),
        )
        if (captchaResult.isErr()) {
          logger.error({
            message: 'Error while verifying captcha',
            meta: logMeta,
            error: captchaResult.error,
          })
          const { errorMessage, statusCode } = mapRouteError(
            captchaResult.error,
          )
          return res.status(statusCode).json({ message: errorMessage })
        }
        break
      }
    }
  }

  return next()
}

export const ensurePublicForm: Middleware<FormSubmissionPipelineContext> = (
  { form, logMeta, res },
  next,
) => {
  const formPublicResult = FormService.isFormPublic(form)
  if (formPublicResult.isErr()) {
    logger.warn({
      message: 'Attempt to submit non-public form',
      meta: logMeta,
      error: formPublicResult.error,
    })
    const { statusCode, errorMessage } = mapRouteError(formPublicResult.error)
    if (statusCode === StatusCodes.GONE) {
      return res.sendStatus(statusCode)
    }
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }
  return next()
}
