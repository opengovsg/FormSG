import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Flex, FormControl } from '@chakra-ui/react'

import ResendOtpButton from '~/templates/ResendOtpButton'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { OtpIcon } from './OtpIcon'

type VfnFieldValues = {
  otp: string
}

interface VerificationBoxProps {
  onSuccess: (signature: string) => void
}
export const VerificationBox = ({
  onSuccess,
}: VerificationBoxProps): JSX.Element => {
  const {
    register,
    formState: { isValid, isSubmitting, errors },
    handleSubmit,
  } = useForm<VfnFieldValues>()

  const onSubmitForm = handleSubmit(async (inputs) => {
    // TODO: Add API call to backend to verify OTP, then return signature.
    return onSuccess('some signature')
  })

  const onResendOtp = useCallback(() => {
    // TODO: Add API call to resend OTP
    return Promise.resolve(console.log('resending'))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmitForm()
    }
  }

  return (
    <Flex px="6.625rem" py="2.25rem" bg="primary.100" align="flex-start">
      <OtpIcon mr="2rem" />
      <Box>
        <Flex>
          <FormControl
            isRequired
            isReadOnly={isValid && isSubmitting}
            isInvalid={!!errors.otp}
            mb={6}
          >
            <FormLabel description="A text message with a verification code was just sent to you. The code will be valid for 10 minutes.">
              Verify your mobile number
            </FormLabel>
            <Flex>
              <Input
                type="text"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                {...register('otp', {
                  required: 'OTP is required.',
                  pattern: {
                    value: /^[0-9\b]+$/,
                    message: 'Only numbers are allowed.',
                  },
                  validate: (value) =>
                    value.length === 6 || 'Please enter a 6 digit OTP.',
                })}
                onKeyDown={handleKeyDown}
              />

              <Button ml="0.5rem" onClick={onSubmitForm}>
                Submit
              </Button>
            </Flex>
            <FormErrorMessage>
              {errors.otp && errors.otp.message}
            </FormErrorMessage>
          </FormControl>
        </Flex>
        <ResendOtpButton p={0} onResendOtp={onResendOtp} />
      </Box>
    </Flex>
  )
}
