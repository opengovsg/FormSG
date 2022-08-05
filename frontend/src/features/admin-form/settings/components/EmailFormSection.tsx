import { useCallback, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { get, isEmpty, isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { EmailFormSettings } from '~shared/types/form/form'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { useMutateFormSettings } from '../mutations'

interface EmailFormSectionProps {
  settings: EmailFormSettings
}

export const EmailFormSection = ({
  settings,
}: EmailFormSectionProps): JSX.Element => {
  const initialEmailSet = useMemo(
    () => new Set(settings.emails),
    [settings.emails],
  )
  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      emails: settings.emails,
    },
  })

  const {
    formState: { errors },
    reset,
  } = formMethods

  const { mutateFormEmails } = useMutateFormSettings()

  const handleSubmitEmails = ({ emails: nextEmails }: { emails: string[] }) => {
    if (isEqual(new Set(nextEmails.filter(Boolean)), initialEmailSet)) {
      return reset()
    }

    return mutateFormEmails.mutate(nextEmails)
  }

  return (
    <FormProvider {...formMethods}>
      <FormControl isInvalid={!isEmpty(errors)}>
        <FormLabel
          isRequired
          useMarkdownForDescription
          description={`Add at least **2 recipients** to prevent loss of response. Learn more on [how to guard against email bounces](${GUIDE_PREVENT_EMAIL_BOUNCE}).`}
        >
          Emails where responses will be sent
        </FormLabel>
        <AdminEmailRecipientsInput onSubmit={handleSubmitEmails} />
        <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
      </FormControl>
    </FormProvider>
  )
}

interface AdminEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
}

const AdminEmailRecipientsInput = ({
  onSubmit,
}: AdminEmailRecipientsInputProps): JSX.Element => {
  const { control, handleSubmit, reset } =
    useFormContext<{ emails: string[] }>()

  const handleBlur = useCallback(() => {
    return handleSubmit(onSubmit, () => reset())()
  }, [handleSubmit, onSubmit, reset])

  return (
    <Controller
      control={control}
      name="emails"
      rules={ADMIN_EMAIL_VALIDATION_RULES}
      render={({ field }) => (
        <TagInput
          placeholder="Separate emails with a comma"
          {...field}
          tagInvalidation={(tag) => !isEmail(tag)}
          onBlur={() => {
            console.log('blurring')
            return handleBlur()
          }}
        />
      )}
    />
  )
}
