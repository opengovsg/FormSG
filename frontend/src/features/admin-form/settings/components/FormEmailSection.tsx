import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { get, isEmpty, isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import {
  EmailFormSettings,
  FormResponseMode,
  StorageFormSettings,
} from '~shared/types/form'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import {
  OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES,
  REQUIRED_ADMIN_EMAIL_VALIDATION_RULES,
} from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

interface EmailFormSectionProps {
  isDisabled: boolean
  settings: EmailFormSettings | StorageFormSettings
}

interface AdminEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
}

const AdminEmailRecipientsInput = ({
  onSubmit,
}: AdminEmailRecipientsInputProps): JSX.Element => {
  const { getValues, setValue, control, handleSubmit } = useFormContext<{
    emails: string[]
    isRequired: boolean
  }>()

  const { data: settings } = useAdminFormSettings()

  const tagValidation = useMemo(() => isEmail, [])

  const handleBlur = useCallback(() => {
    // Get rid of bad tags before submitting.
    setValue(
      'emails',
      (getValues('emails') || []).filter((email) => tagValidation(email)),
    )
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue, tagValidation])

  return (
    <Controller
      control={control}
      name="emails"
      rules={
        settings?.responseMode === FormResponseMode.Email
          ? REQUIRED_ADMIN_EMAIL_VALIDATION_RULES
          : OPTIONAL_ADMIN_EMAIL_VALIDATION_RULES
      }
      render={({ field }) => (
        <TagInput
          {...(getValues('emails')?.length > 0
            ? {}
            : {
                placeholder: 'me@example.com',
              })}
          {...field}
          tagValidation={tagValidation}
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

  const emailModeDescription = `Add at least **2 recipients** to prevent loss of response.`
  const storageModeDescription = `FormSG securely stores responses in an encrypted format and does not retain any associated emails.`

  return (
    <>
      <FormProvider {...formMethods}>
        <FormControl isInvalid={!isEmpty(errors)} isDisabled={isDisabled}>
          <FormLabel
            isRequired={isEmailMode}
            useMarkdownForDescription
            description={
              (isEmailMode ? emailModeDescription : storageModeDescription) +
              ` Learn more on [how to guard against email bounces](${GUIDE_PREVENT_EMAIL_BOUNCE}).`
            }
          >
            Send an email copy of new responses
          </FormLabel>
          <AdminEmailRecipientsInput onSubmit={handleSubmitEmails} />
          <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
          {isEmpty(errors) ? (
            <FormLabel.Description
              color="secondary.400"
              mt="0.5rem"
              opacity={isDisabled ? '0.3' : '1'}
            >
              Separate multiple email addresses with a comma
            </FormLabel.Description>
          ) : null}
        </FormControl>
      </FormProvider>
    </>
  )
}
