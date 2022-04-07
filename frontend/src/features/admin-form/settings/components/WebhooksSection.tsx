import { KeyboardEventHandler, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import {
  FormControl,
  InputGroup,
  InputRightElement,
  Skeleton,
} from '@chakra-ui/react'
import validator from 'validator'

import { FormResponseMode } from '~shared/types/form'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Spinner from '~components/Spinner'

import { useAdminFormSettings } from '../queries'

export const WebhooksSection = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()
  const {
    register,
    formState: { errors, isValid },
    resetField,
    getValues,
  } = useForm<{ url: string }>({
    defaultValues: {
      url: settings?.webhook.url ?? '',
    },
    mode: 'onChange',
  })

  const handleUpdateWebhook = useCallback(() => {
    if (isLoading) return
    const nextWebhookUrl = getValues('url')
    if (settings?.webhook.url === nextWebhookUrl) return
    return console.log(nextWebhookUrl)
  }, [getValues, isLoading, settings?.webhook.url])

  const handleWebhookInputBlur = useCallback(() => {
    if (!isValid) {
      return resetField('url')
    }
    return handleUpdateWebhook()
  }, [handleUpdateWebhook, isValid, resetField])

  const handleWebhookUrlEnterKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (!isValid || e.key !== 'Enter') return
      return handleUpdateWebhook()
    },
    [handleUpdateWebhook, isValid],
  )

  if (!isLoading && settings?.responseMode !== FormResponseMode.Encrypt) {
    return (
      <InlineMessage>
        Webhooks are only available in storage mode forms.
      </InlineMessage>
    )
  }

  return (
    <FormControl
      // isReadOnly={mutateFormTwilioDetails.isLoading}
      isInvalid={!!errors.url}
    >
      <FormLabel description="For developers and IT officers usage. We will POST encrypted form responses in real-time to the HTTPS endpoint specified here.">
        Endpoint URL
      </FormLabel>
      <Skeleton isLoaded={!isLoading}>
        <InputGroup>
          <InputRightElement pointerEvents="none">
            <Spinner />
          </InputRightElement>
          <Input
            onKeyDown={handleWebhookUrlEnterKeyDown}
            {...register('url', {
              onBlur: handleWebhookInputBlur,
              validate: (url) => {
                return (
                  validator.isURL(url, {
                    protocols: ['https'],
                    require_protocol: true,
                  }) || 'Please enter a valid URL (starting with https://)'
                )
              },
            })}
          />
        </InputGroup>
      </Skeleton>
      <FormErrorMessage>{errors.url?.message}</FormErrorMessage>
    </FormControl>
  )
}
