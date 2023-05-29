import { StatusCodes } from 'http-status-codes'

import { IPopulatedEncryptedForm } from 'src/types'

import * as CaptchaService from '../../../services/captcha/captcha.service'
import { Middleware } from '../../../utils/pipeline-middleware'
import { getRequestIp } from '../../../utils/request'
import * as FormService from '../../form/form.service'

import { logger } from './encrypt-submission.controller'
import { mapRouteError } from './encrypt-submission.utils'

type FormSubmissionPipelineContext = {
  req: any
  res: any
  logMeta: { [other: string]: any; action: string }
  form: IPopulatedEncryptedForm
}

export const ensureIsFormWithinSubmissionLimits: Middleware<
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
  void next()
}
export const ensureIsValidCaptcha: Middleware<
  FormSubmissionPipelineContext
> = async ({ form, req, logMeta, res }, next) => {
  if (form.hasCaptcha) {
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
      const { errorMessage, statusCode } = mapRouteError(captchaResult.error)
      return res.status(statusCode).json({ message: errorMessage })
    }
  }
  void next()
}
export const ensureIsPublicForm: Middleware<FormSubmissionPipelineContext> = (
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
  void next()
}
