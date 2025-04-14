import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import validator from 'validator'

const maxEmailLength = 30
const maxTitleLength = 200
const minTitleLength = 4

export const useFormTitleValidationRules = () => {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      required: t('utils.formValidation.titleValidationRules.required'),
      minLength: {
        value: minTitleLength,
        message: t(
          'utils.formValidation.titleValidationRules.minLength.message',
          { minTitleLength },
        ),
      },
      maxLength: {
        value: maxTitleLength,
        message: t(
          'utils.formValidation.titleValidationRules.maxLength.message',
          { maxTitleLength },
        ),
      },
      validate: {
        trimMinLength: (value: string) =>
          value.trim().length >= minTitleLength ||
          t(
            'utils.formValidation.titleValidationRules.validate.trimMinLength',
            { minTitleLength },
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
            emails.filter(Boolean).length <= maxEmailLength ||
            t(
              'utils.formValidation.requiredEmailAdminValidationRules.validate.maxLength',
              { maxEmailLength },
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
