import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, Stack, useBreakpointValue } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { FORM_GUIDE } from '~constants/links'
import { INVALID_EMAIL_ERROR } from '~constants/validation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Link from '~components/Link'

export type LoginFormInputs = {
  email: string
}

interface LoginFormProps {
  onSubmit: (inputs: LoginFormInputs) => Promise<void>
  onOauthLogin: () => void
  isLoadingOauth: boolean
}

export const LoginForm = ({
  onSubmit,
  onOauthLogin,
  isLoadingOauth,
}: LoginFormProps): JSX.Element => {
  const { t } = useTranslation()

  const { handleSubmit, register, formState, setError } =
    useForm<LoginFormInputs>()

  const validateEmail = useCallback((value: string) => {
    return isEmail(value.trim()) || INVALID_EMAIL_ERROR
  }, [])

  const onSubmitForm = async (inputs: LoginFormInputs) => {
    return onSubmit(inputs).catch((e) => {
      setError('email', { type: 'server', message: e.message })
    })
  }

  const isMobile = useBreakpointValue({ base: true, xs: true, lg: false })

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <FormControl
        isInvalid={!!formState.errors.email}
        isReadOnly={formState.isSubmitting}
        mb="2.5rem"
      >
        <FormLabel isRequired>
          {t(
            'features.login.components.LoginForm.onlyAvailableForPublicOfficers',
          )}
        </FormLabel>
        <Input
          autoComplete="email"
          autoFocus
          placeholder="e.g. jane@data.gov.sg"
          {...register('email', {
            required: t(
              'features.login.components.LoginForm.emailEmptyErrorMsg',
            ),
            validate: validateEmail,
          })}
        />
        {formState.errors.email && (
          <FormErrorMessage>{formState.errors.email.message}</FormErrorMessage>
        )}
      </FormControl>
      <Stack
        direction={{ base: 'column', lg: 'row' }}
        spacing="1.5rem"
        align="center"
      >
        <Button
          isFullWidth={isMobile}
          isLoading={formState.isSubmitting}
          isDisabled={isLoadingOauth}
          type="submit"
        >
          {t('features.login.components.LoginForm.login')}
        </Button>
        <Button
          colorScheme="secondary"
          isFullWidth={isMobile}
          isDisabled={formState.isSubmitting}
          isLoading={isLoadingOauth}
          type="button"
          onClick={onOauthLogin}
        >
          Log in with GovLogin
        </Button>
        <Link isExternal variant="standalone" href={FORM_GUIDE}>
          {t('features.login.components.LoginForm.haveAQuestion')}
        </Link>
      </Stack>
    </form>
  )
}
