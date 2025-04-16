import { useCallback } from 'react'
import { Controller } from 'react-hook-form'
import { useFormContext } from 'react-hook-form/dist/useFormContext'
import isEmail from 'validator/lib/isEmail'

import { TagInput } from '~components/TagInput'

import { useAdminFormSettings } from '../../queries'

interface MrfWorkflowCompletionEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
}

const MrfWorkflowCompletionEmailRecipientsInput = ({
  onSubmit,
}: MrfWorkflowCompletionEmailRecipientsInputProps): JSX.Element => {
  const { getValues, setValue, control, handleSubmit } = useFormContext<{
    emails: string[]
    isRequired: boolean
  }>()

  const { data: settings } = useAdminFormSettings()

  const EMAILS_FIELD_NAME = 'emails'

  const handleBlur = useCallback(() => {
    // Get rid of bad tags before submitting.
    setValue(
      EMAILS_FIELD_NAME,
      (getValues(EMAILS_FIELD_NAME) || []).filter((email) => isEmail(email)),
    )
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue])

  const emailsFieldPlaceholder =
    getValues(EMAILS_FIELD_NAME)?.length > 0 ? undefined : 'me@example.com'

  return (
    <Controller<{ emails: string[]; isRequired: boolean }>
      control={control}
      name={EMAILS_FIELD_NAME}
      rules={{
        required: 'ERROR',
      }}
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
