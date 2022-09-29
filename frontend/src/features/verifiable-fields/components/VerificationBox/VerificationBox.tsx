import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Flex, FormControl } from '@chakra-ui/react'

import ResendOtpButton from '~/templates/ResendOtpButton'

import { HttpError } from '~services/ApiService'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { VerifiableFieldType } from '../../types'

import { VFN_RENDER_DATA } from './constants'

type VfnFieldValues = {
  otp: string
}

export interface VerificationBoxProps {
  fieldType: VerifiableFieldType
  handleVerifyOtp: (otp: string) => Promise<string>
  handleResendOtp: () => Promise<void>
}

type UseVerificationBoxProps = Pick<VerificationBoxProps, 'handleVerifyOtp'>

const useVerificationBox = ({ handleVerifyOtp }: UseVerificationBoxProps) => {
  const formMethods = useForm<VfnFieldValues>()
  const { handleSubmit } = formMethods

  const onSubmitForm = handleSubmit(async (inputs) => {
    return handleVerifyOtp(inputs.otp).catch((err: HttpError) => {
      formMethods.setError('otp', {
        message: err.message,
      })
    })
  })

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
    onSubmitForm,
  }
}

export const VerificationBox = ({
  fieldType,
  handleResendOtp,
  handleVerifyOtp,
}: VerificationBoxProps): JSX.Element => {
  const {
    formMethods: {
      register,
      formState: { isValid, isSubmitting, errors },
    },
    handleKeyDown,
    onSubmitForm,
  } = useVerificationBox({
    handleVerifyOtp,
  })

  const {
    logo: Logo,
    header,
    subheader,
  } = useMemo(() => VFN_RENDER_DATA[fieldType], [fieldType])

  return (
    <Flex
      p={{ base: '1.25rem', md: '2.25rem' }}
      bg="primary.100"
      align="flex-start"
      mt="0.5rem"
    >
      <Box d={{ base: 'none', md: 'initial' }} mr="1.5rem">
        <Logo />
      </Box>
      <Box>
        <Flex>
          <FormControl
            isRequired
            isReadOnly={isValid && isSubmitting}
            isInvalid={!!errors.otp}
            maxW="24.75rem"
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
                    value: /^\d+$/,
                    message: 'Only numbers are allowed.',
                  },
                  validate: (value) =>
                    value.length === 6 || 'Please enter a 6 digit OTP.',
                })}
                onKeyDown={handleKeyDown}
              />

              <Button
                ml="0.5rem"
                onClick={onSubmitForm}
                aria-label="Submit OTP for verification"
              >
                Submit
              </Button>
            </Flex>
            <FormErrorMessage>
              {errors.otp && errors.otp.message}
            </FormErrorMessage>
          </FormControl>
        </Flex>
        <ResendOtpButton
          mt="0.5rem"
          variant="link"
          onResendOtp={handleResendOtp}
        />
      </Box>
    </Flex>
  )
}
