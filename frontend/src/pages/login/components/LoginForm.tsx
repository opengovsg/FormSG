import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

type LoginFormInputs = {
  email: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface LoginFormProps {
  onSendOtp: () => void
}

export const LoginForm = ({ onSendOtp }: LoginFormProps): JSX.Element => {
  const { handleSubmit, register, formState } = useForm<LoginFormInputs>()

  const validateEmail = useCallback((value: string) => {
    const isValidEmail = isEmail(value)
    if (!isValidEmail) {
      return 'Please enter a valid email'
    }

    const isGovDomain = value.split('@').pop()?.includes('gov.sg')
    return isGovDomain || 'Please sign in with a gov.sg email address.'
  }, [])

  /**
   * Submit phone number to backend for OTP to be sent to the user.
   */
  const onSubmit = async ({ email }: LoginFormInputs) => {
    // Set mobile number for parent component so next stage is triggered.
    await sleep(2000)
    onSendOtp()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl
        isInvalid={!!formState.errors.email}
        isReadOnly={formState.isSubmitting}
        mb="2.5rem"
      >
        <FormLabel
          isRequired
          htmlFor="email"
          description="Only available for use by public officers with a gov.sg email"
        >
          Email
        </FormLabel>
        <Input
          autoComplete="email"
          autoFocus
          placeholder="e.g. jane@data.gov.sg"
          {...register('email', {
            required: 'Please enter an email address',
            validate: validateEmail,
          })}
        />
        {formState.errors.email && (
          <FormErrorMessage>{formState.errors.email.message}</FormErrorMessage>
        )}
      </FormControl>
      <Button isLoading={formState.isSubmitting} type="submit">
        Sign in
      </Button>
    </form>
  )
}
