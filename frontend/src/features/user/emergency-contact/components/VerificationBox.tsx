import { useCallback, useMemo } from 'react'
import { RegisterOptions, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Flex, FormControl } from '@chakra-ui/react'

import { UserDto } from '~shared/types/user'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import ResendOtpButton from '~templates/ResendOtpButton'

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
  const { t } = useTranslation()
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
      required: t(
        'features.user.emergencyContact.verification.errors.required',
      ),
      pattern: {
        value: /^[0-9\b]+$/,
        message: t(
          'features.user.emergencyContact.verification.errors.numbersOnly',
        ),
      },
      validate: (value) =>
        value.length === 6 ||
        t('features.user.emergencyContact.verification.errors.invalid'),
    }
  }, [t])

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
  const { t } = useTranslation()
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
      bg="primary.100"
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
            <FormLabel
              description={t(
                'features.user.emergencyContact.verification.description',
              )}
            >
              {t('features.user.emergencyContact.verification.label')}
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
                {t('features.common.submit')}
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
