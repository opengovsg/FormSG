import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  RegisterOptions,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormControl } from '@chakra-ui/react'
import { get, isEmpty, isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import {
  EmailFormSettings,
  FormResponseMode,
  StorageFormSettings,
} from '~shared/types/form'

import {
  useOptionalAdminEmailValidationRules,
  useRequiredAdminEmailValidationRules,
} from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { useUser } from '~features/user/queries'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { RespondentCopyToggle } from './EmailNotificationsSection/RespondentCopyToggle'

interface EmailFormSectionProps {
  isDisabled: boolean
  settings: EmailFormSettings | StorageFormSettings
  isHighContrast?: boolean
}

interface AdminEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
  isDisabled: boolean
}

const EMAILS_FIELD_NAME = 'emails'

const AdminEmailRecipientsInput = ({
  onSubmit,
  isDisabled,
}: AdminEmailRecipientsInputProps): JSX.Element => {
  const { getValues, setValue, control, handleSubmit } = useFormContext<{
    emails: string[]
    isRequired: boolean
  }>()

  const { data: settings } = useAdminFormSettings()

  const requiredAdminEmailValidationRules =
    useRequiredAdminEmailValidationRules()
  const optionalAdminEmailValidationRules =
    useOptionalAdminEmailValidationRules()

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
          ? requiredAdminEmailValidationRules
          : optionalAdminEmailValidationRules) as RegisterOptions<{
          emails: string[]
          isRequired: boolean
        }>
      }
      render={({ field }) => (
        <TagInput
          placeholder={isDisabled ? undefined : emailsFieldPlaceholder}
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
  isHighContrast = true,
}: EmailFormSectionProps): JSX.Element => {
  //TODO: (Respondent Copy): Remove isTest and user when respondent copy is out of beta
  const { user } = useUser()
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.emailNotifications',
  })
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

  return (
    <>
      <FormProvider {...formMethods}>
        <FormControl isInvalid={!isEmpty(errors)} isDisabled={isDisabled}>
          <FormLabel
            isRequired={isEmailMode}
            useMarkdownForDescription
            description={t('section.regular.labelDescription')}
            isHighContrast={isHighContrast}
          >
            {t('section.regular.label')}
          </FormLabel>
          <AdminEmailRecipientsInput
            onSubmit={handleSubmitEmails}
            isDisabled={isDisabled}
          />
          <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
          {isEmpty(errors) ? (
            <FormLabel.Description
              color="secondary.400"
              mt="0.5rem"
              opacity="1"
            >
              {t('section.regular.description')}
            </FormLabel.Description>
          ) : null}
        </FormControl>
        {isTest || user?.betaFlags?.respondentCopy ? (
          <FormControl isDisabled={isDisabled}>
            <Box mt={'1.5rem'}>
              <RespondentCopyToggle />
            </Box>
          </FormControl>
        ) : null}
      </FormProvider>
    </>
  )
}
