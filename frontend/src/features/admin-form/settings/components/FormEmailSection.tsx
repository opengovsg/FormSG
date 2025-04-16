import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  RegisterOptions,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Heading } from '@chakra-ui/react'
import { get, isEmpty, isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import {
  EmailFormSettings,
  FormResponseMode,
  StorageFormSettings,
} from '~shared/types/form'

import {
  OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES,
  REQUIRED_ADMIN_EMAIL_VALIDATION_RULES,
} from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { RespondentCopyToggle } from './EmailNotificationsSection/RespondentCopyToggle'
import { RespondentCustomiseEmail } from './EmailNotificationsSection/RespondentCustomiseEmail'
import { CategorySubHeader } from './CategorySubHeader'

interface EmailFormSectionProps {
  isDisabled: boolean
  settings: EmailFormSettings | StorageFormSettings
}

interface AdminEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
}

const EMAILS_FIELD_NAME = 'emails'

const AdminEmailRecipientsInput = ({
  onSubmit,
}: AdminEmailRecipientsInputProps): JSX.Element => {
  const { getValues, setValue, control, handleSubmit } = useFormContext<{
    emails: string[]
    isRequired: boolean
  }>()

  const { data: settings } = useAdminFormSettings()

  const handleBlur = useCallback(() => {
    // Get rid of bad tags before submitting.
    setValue(
      'emails',
      (getValues('emails') || []).filter((email) => isEmail(email)),
    )
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue])

  const emailsFieldPlaceholder =
    getValues(EMAILS_FIELD_NAME)?.length > 0 ? undefined : 'me@example.com'

  return (
    <Controller<{ emails: string[]; isRequired: boolean }>
      control={control}
      name={EMAILS_FIELD_NAME}
      rules={
        (settings?.responseMode === FormResponseMode.Email
          ? REQUIRED_ADMIN_EMAIL_VALIDATION_RULES
          : OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES) as RegisterOptions<{
          emails: string[]
          isRequired: boolean
        }>
      }
      render={({ field }) => (
        <TagInput
          placeholder={emailsFieldPlaceholder}
          {...field}
          value={field.value as string[]}
          tagValidation={isEmail}
          onBlur={handleBlur}
        />
      )}
    />
  )
}

export const FormEmailSection = ({
  isDisabled,
  settings,
}: EmailFormSectionProps): JSX.Element => {
  const { t } = useTranslation()
  const initialEmailSet = useMemo(
    () => new Set(settings.emails),
    [settings.emails],
  )
  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: { emails: settings.emails },
  })

  const {
    formState: { errors },
    reset,
  } = formMethods

  const { mutateFormEmails } = useMutateFormSettings()

  const handleSubmitEmails = useCallback(
    ({ emails }: { emails: string[] }) => {
      if (isEqual(new Set(emails.filter(Boolean)), initialEmailSet)) return
      return mutateFormEmails.mutate(emails)
    },
    [initialEmailSet, mutateFormEmails],
  )

  useEffect(() => reset({ emails: settings.emails }), [settings.emails, reset])

  const isEmailMode = settings.responseMode === FormResponseMode.Email

  const DESCRIPTION_TEXT = t(
    'features.adminForm.settings.emailNotifications.section.regular.info',
  )

  return (
    <>
      <FormProvider {...formMethods}>
        <FormControl isInvalid={!isEmpty(errors)} isDisabled={isDisabled}>
          <CategorySubHeader>Admin</CategorySubHeader>
          <FormLabel
            isRequired={isEmailMode}
            useMarkdownForDescription
            description={DESCRIPTION_TEXT}
          >
            {t(
              'features.adminForm.settings.emailNotifications.section.regular.label',
            )}
          </FormLabel>
          <AdminEmailRecipientsInput onSubmit={handleSubmitEmails} />
          <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
          {isEmpty(errors) ? (
            <FormLabel.Description
              color="secondary.400"
              mt="0.5rem"
              opacity={isDisabled ? '0.3' : '1'}
            >
              {t(
                'features.adminForm.settings.emailNotifications.section.regular.description',
              )}
            </FormLabel.Description>
          ) : null}
          <CategorySubHeader mt={'3rem'}>Respondent</CategorySubHeader>
          <RespondentCopyToggle />
          <RespondentCustomiseEmail />
        </FormControl>
      </FormProvider>
    </>
  )
}
