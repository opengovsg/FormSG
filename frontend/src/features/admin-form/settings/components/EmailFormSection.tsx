import { useCallback, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { get, isEmpty, isEqual } from 'lodash'
import validator from 'validator'

import { EmailFormSettings } from '~shared/types/form/form'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../mutations'

const MAX_EMAIL_LENGTH = 30
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
      <FormControl mt="2rem" isInvalid={!isEmpty(errors)}>
        <FormLabel
          isRequired
          useMarkdownForDescription
          description="Add at least **2 recipients** to prevent loss of response. Learn more [how to guard against bounce emails](https://go.gov.sg/form-prevent-bounce)."
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
  onSubmit: (params: { emails: [] }) => void
}

const AdminEmailRecipientsInput = ({
  onSubmit,
}: AdminEmailRecipientsInputProps): JSX.Element => {
  const { control, handleSubmit, reset } =
    useFormContext<{ emails: string[] }>()

  // Functions to transform input and output of the field.
  const inputTransform = useMemo(
    () => ({
      // Combine and display all emails in a single string in the input field.
      input: (value: string[]) => value.join(','),
      // Convert joined email string into an array of emails.
      output: (value: string) =>
        value
          .replace(/\s/g, '')
          .split(',')
          .map((v) => v.trim()),
    }),
    [],
  )

  const handleBlur = useCallback(() => {
    return handleSubmit(onSubmit, () => reset())()
  }, [handleSubmit, onSubmit, reset])

  const validationRules = useMemo(() => {
    return {
      validate: {
        required: (emails: string[]) => {
          return (
            emails.filter(Boolean).length > 0 ||
            'You must at least enter one email to receive responses'
          )
        },
        valid: (emails: string[]) => {
          return (
            emails.filter(Boolean).every((e) => validator.isEmail(e)) ||
            'Please enter valid email(s) (e.g. me@example.com) separated by commas.'
          )
        },
        duplicate: (emails: string[]) => {
          return (
            new Set(emails).size === emails.length ||
            'Please remove duplicate emails.'
          )
        },
        maxLength: (emails: string[]) => {
          return (
            emails.length <= MAX_EMAIL_LENGTH ||
            'Please limit number of emails to 30.'
          )
        },
      },
    }
  }, [])

  return (
    <Controller
      control={control}
      name="emails"
      rules={validationRules}
      render={({ field }) => (
        <Input
          value={inputTransform.input(field.value)}
          onChange={(e) =>
            field.onChange(inputTransform.output(e.target.value))
          }
          onBlur={handleBlur}
        />
      )}
    />
  )
}
