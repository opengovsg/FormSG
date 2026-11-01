import { Joi } from 'celebrate'
import { ErrorDto, I18nMessageParams } from 'formsg-shared/types'

export const buildErrorDto = (
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

export const attachErrorI18nByCode = <T extends Joi.Schema>(
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

export const attachErrorI18n = <T extends Joi.Schema>(
  schema: T,
  messageKey: string,
  messageParams?: I18nMessageParams,
): T =>
  attachErrorI18nByCode(schema, () => ({
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
