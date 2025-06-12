import { Controller, RegisterOptions, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, Text } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { RESPONDENT_EMAIL_FIELD_ID } from '~shared/constants'

import { useOptionalAdminEmailValidationRules } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

export const PublicRespondentEmailField = (): JSX.Element => {
  const { t } = useTranslation()
  const { form } = usePublicFormContext()

  const baseRules = useOptionalAdminEmailValidationRules()
  const rules: RegisterOptions<
    { respondent_email_field: string[] },
    'respondent_email_field'
  > = {
    ...baseRules,
    validate: {
      ...baseRules.validate,
      maxEmails: (value: string[]) =>
        value.length <= 5 || 'Please enter a maximum of 5 emails',
    },
  }

  const fieldTitle =
    form?.hasRespondentCopy &&
    'hasStatusTracker' in form &&
    form?.hasStatusTracker
      ? t(
          'features.publicForm.components.fields.respondentEmail.respondentCopyAndStatusTracker',
        )
      : form?.hasRespondentCopy
        ? t(
            'features.publicForm.components.fields.respondentEmail.respondentCopy',
          )
        : form && 'hasStatusTracker' in form && form?.hasStatusTracker
          ? t(
              'features.publicForm.components.fields.respondentEmail.statusTracker',
            )
          : t('features.publicForm.components.fields.respondentEmail.title') // default

  const {
    control,
    formState: { errors },
  } = useFormContext<{ respondent_email_field: string[] }>()

  return (
    <FormControl
      isInvalid={!!errors?.[RESPONDENT_EMAIL_FIELD_ID]?.message}
      isRequired={false}
    >
      <Controller
        name={RESPONDENT_EMAIL_FIELD_ID}
        control={control}
        rules={rules}
        render={({ field }) => (
          <Box>
            <FormLabel>{fieldTitle}</FormLabel>
            <TagInput
              {...field}
              value={field.value as string[]}
              tagValidation={isEmail}
            />
            {get(errors, `${RESPONDENT_EMAIL_FIELD_ID}.message`) ? (
              <FormErrorMessage>
                {get(errors, `${RESPONDENT_EMAIL_FIELD_ID}.message`)}
              </FormErrorMessage>
            ) : (
              <Text
                color="secondary.400"
                textStyle="body-2"
                aria-hidden
                my="0.125rem" // same as error message margin
              >
                {t(
                  'features.publicForm.components.fields.respondentEmail.info',
                )}
              </Text>
            )}
          </Box>
        )}
      />
    </FormControl>
  )
}