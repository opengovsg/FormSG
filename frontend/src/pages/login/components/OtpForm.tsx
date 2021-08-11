import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

type OtpFormInputs = {
  otp: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// interface LoginFormProps {
//   onLogin: (values: LoginFormInputs) => void
// }

export const OtpForm = (): JSX.Element => {
  const { handleSubmit, register, formState } = useForm<OtpFormInputs>()

  const validateOtp = useCallback(
    (value: string) => value.length === 6 || 'Please enter a 6 digit OTP.',
    [],
  )

  /**
   * Submit phone number to backend for OTP to be sent to the user.
   */
  const onSubmit = async ({ otp }: OtpFormInputs) => {
    // Set mobile number for parent component so next stage is triggered.
    await sleep(2000)
    if (otp === '123456') {
      alert(otp)
    } else {
      alert('There is an error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!!formState.errors.otp} mb="2.5rem">
        <FormLabel isRequired htmlFor="otp">
          Enter 6 digit OTP sent to your email
        </FormLabel>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          {...register('otp', {
            required: 'OTP is required',
            validate: validateOtp,
          })}
        />
        {formState.errors.otp && (
          <FormErrorMessage>{formState.errors.otp.message}</FormErrorMessage>
        )}
      </FormControl>
      <Button isLoading={formState.isSubmitting} type="submit">
        Sign in
      </Button>
    </form>
  )
}
