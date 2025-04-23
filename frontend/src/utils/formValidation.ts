import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import validator from 'validator'

const MAX_EMAIL_LENGTH = 30
const MAX_TITLE_LENGTH = 200
const MIN_TITLE_LENGTH = 4

export const useFormTitleValidationRules = () => {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      required: t('utils.formValidation.titleValidationRules.required'),
      minLength: {
        value: MIN_TITLE_LENGTH,
        message: t(
          'utils.formValidation.titleValidationRules.minLength.message',
          { MIN_TITLE_LENGTH },
        ),
      },
      maxLength: {
        value: MAX_TITLE_LENGTH,
        message: t(
          'utils.formValidation.titleValidationRules.maxLength.message',
          { MAX_TITLE_LENGTH },
        ),
      },
      validate: {
        trimMinLength: (value: string) =>
          value.trim().length >= MIN_TITLE_LENGTH ||
          t(
            'utils.formValidation.titleValidationRules.validate.trimMinLength',
            { MIN_TITLE_LENGTH },
          ),
      },
    }),
    [t],
  )
}

export const useRequiredAdminEmailValidationRules = () => {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      validate: {
        required: (emails: string[]) => {
          return (
            emails.filter(Boolean).length > 0 ||
            t(
              'utils.formValidation.requiredEmailAdminValidationRules.validate.required',
            )
          )
        },
        valid: (emails: string[]) => {
          return (
            emails.filter(Boolean).every((e) => validator.isEmail(e)) ||
            t(
              'utils.formValidation.requiredEmailAdminValidationRules.validate.valid',
            )
          )
        },
        duplicate: (emails: string[]) => {
          const truthyEmails = emails.filter(Boolean)
          return (
            new Set(truthyEmails).size === truthyEmails.length ||
            t(
              'utils.formValidation.requiredEmailAdminValidationRules.validate.duplicate',
            )
          )
        },
        maxLength: (emails: string[]) => {
          return (
            emails.filter(Boolean).length <= MAX_EMAIL_LENGTH ||
            t(
              'utils.formValidation.requiredEmailAdminValidationRules.validate.maxLength',
              { MAX_EMAIL_LENGTH },
            )
          )
        },
      },
    }),
    [t],
  )
}

export const useOptionalAdminEmailValidationRules = () => {
  const requiredAdminEmailValidationRules =
    useRequiredAdminEmailValidationRules()

  return useMemo(
    () => ({
      ...requiredAdminEmailValidationRules,
      validate: {
        ...requiredAdminEmailValidationRules.validate,
        required: () => true,
      },
    }),
    [requiredAdminEmailValidationRules],
  )
}
