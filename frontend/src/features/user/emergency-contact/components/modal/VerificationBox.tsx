import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Flex, FormControl } from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import ResendOtpButton from '~templates/ResendOtpButton'

import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'

import { OtpIcon } from './OtpIcon'

type VfnFieldValues = {
  otp: string
}

interface VerificationBoxProps {
  onSuccess: () => void
  contact: string
}

export const VerificationBox = ({
  onSuccess,
  contact,
}: VerificationBoxProps): JSX.Element => {
  const { user } = useUser()
  const {
    register,
    setError,
    formState: { isValid, isSubmitting, errors },
    handleSubmit,
  } = useForm<VfnFieldValues>()

  const { verifyOtpMutation, generateOtpMutation } = useUserMutations()

  const onSubmitForm = handleSubmit(async (inputs) => {
    if (!user) return
    return verifyOtpMutation.mutate(
      { userId: user._id, contact, otp: inputs.otp },
      {
        onSuccess,
        onError: (error) =>
          setError('otp', { type: 'server', message: error.message }),
      },
    )
  })

  const onResendOtp = useCallback(async () => {
    if (!user) return
    return generateOtpMutation.mutate(
      { userId: user._id, contact },
      {
        onError: (error) =>
          setError('otp', { type: 'server', message: error.message }),
      },
    )
  }, [contact, generateOtpMutation, setError, user])

  return (
    <Flex
      px="4.5rem"
      py="2.25rem"
      bg="primary.100"
      align="flex-start"
      mt="2.5rem"
    >
      <OtpIcon mr="2rem" maxW="9rem" />
      <form>
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
              />

              <Button
                ml="0.5rem"
                type="submit"
                isLoading={verifyOtpMutation.isLoading}
                onClick={onSubmitForm}
              >
                Submit
              </Button>
            </Flex>
            <FormErrorMessage>
              {errors.otp && errors.otp.message}
            </FormErrorMessage>
          </FormControl>
        </Flex>
        <ResendOtpButton onResendOtp={onResendOtp} />
      </form>
    </Flex>
  )
}
