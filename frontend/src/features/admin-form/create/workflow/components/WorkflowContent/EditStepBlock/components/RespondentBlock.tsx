import { Controller, get, UseFormReturn } from 'react-hook-form'
import { FormControl, Stack } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import { TagInput } from '~components/TagInput'

import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { BlockLabelText } from './BlockLabelText'

interface RespondentBlockProps {
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
}

export const RespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
}: RespondentBlockProps): JSX.Element => {
  const {
    formState: { errors },
    control,
  } = formMethods

  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      <BlockLabelText id="emails-label" htmlFor="emails">
        Respondent in this step
      </BlockLabelText>
      <FormControl
        isReadOnly={isLoading}
        id="emails"
        isRequired
        isInvalid={!!errors.emails}
      >
        <Controller
          name="emails"
          control={control}
          rules={{
            validate: {
              required: (emails) =>
                stepNumber === 0
                  ? emails.length === 0 || 'Emails are not allowed for Step 1' // This should never be seen
                  : emails.length > 0 || 'Please add at least one email',
              isEmails: (emails) =>
                emails.every((email) => isEmail(email)) ||
                'Please remove invalid emails',
            },
          }}
          render={({ field }) => (
            <TagInput
              placeholder={
                stepNumber === 0
                  ? 'Anyone you share the form link with'
                  : 'me@example.com'
              }
              disabled={stepNumber === 0}
              tagValidation={isEmail}
              {...field}
            />
          )}
        />
        <FormErrorMessage>{get(errors, `emails.message`)}</FormErrorMessage>
      </FormControl>
    </Stack>
  )
}
