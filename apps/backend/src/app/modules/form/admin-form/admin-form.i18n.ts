import { Joi } from 'celebrate'
import { ErrorDto, I18nMessageParams } from 'formsg-shared/types'

const ADMIN_FORM_BACKEND_ERROR_KEY_PREFIX =
  'features.adminForm.backendErrors' as const

export const adminFormErrorKey = (suffix: string) =>
  `${ADMIN_FORM_BACKEND_ERROR_KEY_PREFIX}.${suffix}`

export const buildAdminFormErrorDto = (
  message: string,
  messageKey?: string,
  messageParams?: I18nMessageParams,
): ErrorDto => ({
  message,
  ...(messageKey ? { messageKey } : {}),
  ...(messageParams ? { messageParams } : {}),
})

type JoiErrorReportWithI18n = Joi.ErrorReport & {
  code: string
  local: Record<string, unknown>
}

type ErrorI18n = Pick<ErrorDto, 'messageKey' | 'messageParams'>

export const attachAdminFormErrorI18nByCode = <T extends Joi.Schema>(
  schema: T,
  getI18n: (code: string) => ErrorI18n | undefined,
): T => {
  const attachI18n = ((errors: Joi.ErrorReport[]) => {
    errors.forEach((error) => {
      const report = error as JoiErrorReportWithI18n
      const i18n = getI18n(report.code)
      if (i18n?.messageKey) report.local.messageKey = i18n.messageKey
      if (i18n?.messageParams) {
        report.local.messageParams = i18n.messageParams
      }
    })
    return errors
  }) as unknown as Joi.ValidationErrorFunction

  return schema.error(attachI18n) as T
}

export const attachAdminFormErrorI18n = <T extends Joi.Schema>(
  schema: T,
  messageKey: string,
  messageParams?: I18nMessageParams,
): T =>
  attachAdminFormErrorI18nByCode(schema, () => ({
    messageKey,
    messageParams,
  }))

export const getCelebrateErrorI18n = (
  detail: Joi.ValidationErrorItem,
): Pick<ErrorDto, 'messageKey' | 'messageParams'> => {
  const messageKey = detail.context?.messageKey
  const messageParams = detail.context?.messageParams

  return {
    ...(typeof messageKey === 'string' ? { messageKey } : {}),
    ...(typeof messageParams === 'object' && messageParams !== null
      ? { messageParams: messageParams as I18nMessageParams }
      : {}),
  }
}
