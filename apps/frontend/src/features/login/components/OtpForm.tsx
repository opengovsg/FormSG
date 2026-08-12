import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Stack, useBreakpointValue } from '@chakra-ui/react'

import { OTP_LENGTH, OTP_REGEX } from 'formsg-shared/constants'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import ResendOtpButton from '~templates/ResendOtpButton'

export type OtpFormInputs = {
  otp: string
}

interface OtpFormProps {
  email: string
  otpPrefix: string
  onSubmit: (inputs: OtpFormInputs) => Promise<void>
  onResendOtp: () => Promise<void>
}

export const OtpForm = ({
  email,
  otpPrefix,
  onSubmit,
  onResendOtp,
}: OtpFormProps): JSX.Element => {
  const { t } = useTranslation()

  const { handleSubmit, register, formState, setError } =
    useForm<OtpFormInputs>()

  const isMobile = useBreakpointValue({ base: true, xs: true, lg: false })

  const onSubmitForm = async (inputs: OtpFormInputs) => {
    return onSubmit(inputs).catch((e) => {
      setError('otp', { type: 'server', message: e.message })
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <FormControl isInvalid={!!formState.errors.otp} mb="1rem">
        <FormLabel isRequired htmlFor="otp">
          {t('features.login.components.OTPForm.otpFromEmail', {
            email: email.toLowerCase(),
          })}
        </FormLabel>
        <Input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={OTP_LENGTH}
          autoComplete="one-time-code"
          autoFocus
          {...register('otp', {
            required: t('features.login.components.OTPForm.otpRequired'),
            pattern: {
              value: new RegExp(OTP_REGEX.source, 'i'),
              message: t('features.login.components.OTPForm.otpLengthCheck', {
                otpLength: OTP_LENGTH,
              }),
            },
          })}
          prefix={otpPrefix === undefined ? undefined : `${otpPrefix} -`}
        />
        {formState.errors.otp && (
          <FormErrorMessage>{formState.errors.otp.message}</FormErrorMessage>
        )}
      </FormControl>
      <Stack
        direction={{ base: 'column', lg: 'row' }}
        spacing="1rem"
        align="center"
      >
        <Button
          isFullWidth={isMobile}
          isLoading={formState.isSubmitting}
          type="submit"
        >
          {t('features.login.components.OTPForm.signin')}
        </Button>
        <ResendOtpButton onResendOtp={onResendOtp} />
      </Stack>
    </form>
  )
}
