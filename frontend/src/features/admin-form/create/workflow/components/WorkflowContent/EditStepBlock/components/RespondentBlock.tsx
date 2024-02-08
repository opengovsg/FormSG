import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl, Stack } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { isFirstStepByStepNumber } from '../../utils/isFirstStepByStepNumber'

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

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

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
        isInvalid={!!errors.email}
      >
        <Controller
          name="email"
          control={control}
          rules={{
            validate: {
              required: (email) =>
                isFirstStep
                  ? !email || 'Emails are not allowed for Step 1' // This should never be seen
                  : !!email || 'Please add an email',
              isEmails: (email) =>
                !email || isEmail(email) || 'Please enter a valid email',
            },
          }}
          render={({ field }) => (
            <Input
              placeholder={
                isFirstStep
                  ? 'Anyone you share the form link with'
                  : 'me@example.com'
              }
              disabled={isFirstStep}
              {...field}
            />
          )}
        />
        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
      </FormControl>
    </Stack>
  )
}
