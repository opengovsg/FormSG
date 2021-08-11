import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

export type LoginFormInputs = {
  email: string
}

interface LoginFormProps {
  onSubmit: (inputs: LoginFormInputs) => Promise<void>
}

export const LoginForm = ({ onSubmit }: LoginFormProps): JSX.Element => {
  const { handleSubmit, register, formState, setError } =
    useForm<LoginFormInputs>()

  const validateEmail = useCallback((value: string) => {
    const isValidEmail = isEmail(value)
    if (!isValidEmail) {
      return 'Please enter a valid email'
    }

    const isGovDomain = value.split('@').pop()?.includes('gov.sg')
    return isGovDomain || 'Please sign in with a gov.sg email address.'
  }, [])

  const onSubmitForm = async (inputs: LoginFormInputs) => {
    return onSubmit(inputs).catch((e) => {
      setError('email', { type: 'server', message: e.message })
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <FormControl
        isInvalid={!!formState.errors.email}
        isReadOnly={formState.isSubmitting}
        mb="2.5rem"
      >
        <FormLabel
          isRequired
          htmlFor="email"
          description="Only available for use by public officers with a gov.sg email"
        >
          Email
        </FormLabel>
        <Input
          autoComplete="email"
          autoFocus
          placeholder="e.g. jane@data.gov.sg"
          {...register('email', {
            required: 'Please enter an email address',
            validate: validateEmail,
          })}
        />
        {formState.errors.email && (
          <FormErrorMessage>{formState.errors.email.message}</FormErrorMessage>
        )}
      </FormControl>
      <Button isLoading={formState.isSubmitting} type="submit">
        Sign in
      </Button>
    </form>
  )
}
