import { useCallback, useMemo } from 'react'
import { RegisterOptions, useForm } from 'react-hook-form'
import { Flex, FormControl } from '@chakra-ui/react'
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Input,
} from '@opengovsg/design-system-react'

import { UserDto } from '~shared/types/user'

import { ResendOtpButton } from '~templates/ResendOtpButton/ResendOtpButton'

import { useUserMutations } from '~features/user/mutations'

import { OtpIcon } from './OtpIcon'

type VfnFieldValues = {
  otp: string
}

interface VerificationBoxProps {
  userId: UserDto['_id']
  onSuccess: () => void
  contact: string
}

const useVerificationBox = ({
  userId,
  onSuccess,
  contact,
}: VerificationBoxProps) => {
  const {
    register,
    setError,
    formState: { isValid, isSubmitting, errors },
    handleSubmit,
  } = useForm<VfnFieldValues>()

  const { verifyOtpMutation, generateOtpMutation } = useUserMutations()

  const onSubmitForm = handleSubmit(
    useCallback(
      (inputs: VfnFieldValues) => {
        return verifyOtpMutation.mutate(
          { userId, contact, otp: inputs.otp },
          {
            onSuccess,
            onError: (error) =>
              setError('otp', { type: 'server', message: error.message }),
          },
        )
      },
      [contact, onSuccess, setError, userId, verifyOtpMutation],
    ),
  )

  const onResendOtp = useCallback(async () => {
    return generateOtpMutation.mutate(
      { userId, contact },
      {
        onError: (error) =>
          setError('otp', { type: 'server', message: error.message }),
      },
    )
  }, [contact, generateOtpMutation, setError, userId])

  const isInputReadOnly = useMemo(
    () => isValid && isSubmitting,
    [isSubmitting, isValid],
  )

  const isOtpButtonLoading = useMemo(
    () => verifyOtpMutation.isLoading,
    [verifyOtpMutation.isLoading],
  )

  const otpValidationRules: RegisterOptions<VfnFieldValues> = useMemo(() => {
    return {
      required: 'OTP is required.',
      pattern: {
        value: /^[0-9\b]+$/,
        message: 'Only numbers are allowed.',
      },
      validate: (value) => value.length === 6 || 'Please enter a 6 digit OTP.',
    }
  }, [])

  return {
    onSubmitForm,
    onResendOtp,
    isInputReadOnly,
    isOtpButtonLoading,
    otpValidationRules,
    otpInputError: errors.otp,
    otpInputRegister: register,
  }
}

export const VerificationBox = (props: VerificationBoxProps): JSX.Element => {
  const {
    onResendOtp,
    onSubmitForm,
    isInputReadOnly,
    otpInputError,
    otpValidationRules,
    isOtpButtonLoading,
    otpInputRegister,
  } = useVerificationBox(props)

  return (
    <Flex
      px={{ base: '1.25rem', md: '4.5rem' }}
      py={{ base: '1.25rem', md: '2.25rem' }}
      bg="brand.primary.50"
      align="flex-start"
      mt="2.5rem"
    >
      <OtpIcon
        display={{ base: 'none', md: 'initial' }}
        mr="2rem"
        maxW="9rem"
      />
      <form>
        <Flex>
          <FormControl
            isRequired
            isReadOnly={isInputReadOnly}
            isInvalid={!!otpInputError}
            mb={6}
          >
            <FormLabel description="A text message with a verification code was just sent to you. The code will be valid for 10 minutes.">
              Verify your mobile number
            </FormLabel>
            <Flex>
              <Input
                data-testid="otp-input"
                type="text"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                {...otpInputRegister('otp', otpValidationRules)}
              />

              <Button
                ml="0.5rem"
                type="submit"
                isLoading={isOtpButtonLoading}
                onClick={onSubmitForm}
              >
                Submit
              </Button>
            </Flex>
            <FormErrorMessage>{otpInputError?.message}</FormErrorMessage>
          </FormControl>
        </Flex>
        <ResendOtpButton onResendOtp={onResendOtp} />
      </form>
    </Flex>
  )
}
