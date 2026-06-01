import { CaptchaTypes } from 'formsg-shared/types/captcha'

import { IPopulatedForm } from '../../../../types'
import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import * as CaptchaService from '../../../services/captcha/captcha.service'
import * as TurnstileService from '../../../services/turnstile/turnstile.service'
import { Middleware } from '../../../utils/pipeline-middleware'
import { getRequestIp } from '../../../utils/request'
import * as FormService from '../../form/form.service'
import { mapRouteError, sendRouteError } from '../submission.utils'

const logger = createLoggerWithLabel(module)

type FormSubmissionPipelineContext = {
  // FIXME: Replace with actual request and response types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: any
  logMeta: CustomLoggerParams['meta']
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
    const routeError = mapRouteError(formSubmissionLimitResult.error)
    return sendRouteError(res, routeError, {
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
          return sendRouteError(res, mapRouteError(turnstileResult.error))
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
          return sendRouteError(res, mapRouteError(captchaResult.error))
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
    return sendRouteError(res, mapRouteError(formPublicResult.error))
  }
  return next()
}
