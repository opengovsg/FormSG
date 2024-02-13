import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl, Stack, Text } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

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
      <Text textStyle="subhead-3">Respondent in this step</Text>
      {isFirstStep ? (
        <Text>Anyone you share the form link with</Text>
      ) : (
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
              required: 'Please add an email',
              validate: {
                isEmails: (email) =>
                  !email || isEmail(email) || 'Please enter a valid email',
              },
            }}
            render={({ field }) => (
              <Input placeholder="me@example.com" {...field} />
            )}
          />
          <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
        </FormControl>
      )}
    </Stack>
  )
}
