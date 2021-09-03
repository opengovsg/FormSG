import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Flex, FormControl } from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

import ResendOtpButton from '~/templates/ResendOtpButton'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { MobileOtpIcon } from './MobileOtpIcon'

type VfnFieldValues = {
  otp: string
}

interface VerificationBoxProps {
  onSuccess: (signature: string) => void
  fieldType: BasicField.Mobile | BasicField.Email
}

const VFN_DATA = {
  [BasicField.Mobile]: {
    LogoComponent: MobileOtpIcon,
    header: 'Verify your mobile number',
    subheader:
      'An SMS with a 6-digit verification code was sent to you. It will be valid for 10 minutes.',
  },
  [BasicField.Email]: {
    // TODO: Update to EmailOtpIcon
    LogoComponent: MobileOtpIcon,
    header: 'Verify your email',
    subheader:
      'An email with a 6-digit verification code was sent to you. It will be valid for 10 minutes.',
  },
}

export const VerificationBox = ({
  fieldType,
  onSuccess,
}: VerificationBoxProps): JSX.Element => {
  const { LogoComponent, header, subheader } = VFN_DATA[fieldType]
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmitForm()
      }
    },
    [onSubmitForm],
  )

  return (
    <Flex
      px={{ base: '1.25rem', md: '6.625rem' }}
      py={{ base: '1.25rem', md: '2.25rem' }}
      bg="primary.100"
      align="flex-start"
      mt="-1rem"
    >
      <LogoComponent d={{ base: 'none', md: 'initial' }} mr="2rem" />
      <Box>
        <Flex>
          <FormControl
            isRequired
            isReadOnly={isValid && isSubmitting}
            isInvalid={!!errors.otp}
          >
            <FormLabel description={subheader}>{header}</FormLabel>
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
