import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Flex, FormControl } from '@chakra-ui/react'

import ResendOtpButton from '~/templates/ResendOtpButton'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { VerifiableFieldType } from '../types'
import { useVerifiableField } from '../VerifiableFieldContext'

import { VFN_RENDER_DATA } from './constants'

type VfnFieldValues = {
  otp: string
}

export interface VerificationBoxProps {
  fieldType: VerifiableFieldType
}

const useVerificationBox = () => {
  const formMethods = useForm<VfnFieldValues>()
  const { handleSubmit } = formMethods

  const { handleVfnSuccess } = useVerifiableField()

  const onSubmitForm = handleSubmit(async (inputs) => {
    // TODO: Add API call to backend to verify OTP, then return signature.
    return handleVfnSuccess(`some signature-${inputs.otp}`)
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

  return {
    formMethods,
    handleKeyDown,
    onResendOtp,
    onSubmitForm,
  }
}

export const VerificationBox = ({
  fieldType,
}: VerificationBoxProps): JSX.Element => {
  const {
    formMethods: {
      register,
      formState: { isValid, isSubmitting, errors },
    },
    handleKeyDown,
    onSubmitForm,
    onResendOtp,
  } = useVerificationBox()

  const {
    logo: Logo,
    header,
    subheader,
  } = useMemo(() => VFN_RENDER_DATA[fieldType], [fieldType])

  return (
    <Flex
      px={{ base: '1.25rem', md: '6.625rem' }}
      py={{ base: '1.25rem', md: '2.25rem' }}
      bg="primary.100"
      align="flex-start"
      mt="-1rem"
    >
      <Box d={{ base: 'none', md: 'initial' }} mr="2rem">
        <Logo />
      </Box>
      <Box>
        <Flex>
          <FormControl
            isRequired
            isReadOnly={isValid && isSubmitting}
            isInvalid={!!errors.otp}
            maxW="18rem"
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
        <ResendOtpButton onResendOtp={onResendOtp} />
      </Box>
    </Flex>
  )
}
