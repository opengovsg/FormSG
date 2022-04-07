import { KeyboardEventHandler, useCallback, useEffect } from 'react'
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

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const WebhooksSection = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()
  const { mutateFormWebhookUrl } = useMutateFormSettings()
  const {
    register,
    formState: { errors, isValid },
    resetField,
    getValues,
  } = useForm<{ url: string }>({
    mode: 'onChange',
  })

  useEffect(() => {
    if (isLoading || !settings) return
    resetField('url', { defaultValue: settings.webhook.url })
  }, [isLoading, resetField, settings])

  const handleUpdateWebhook = useCallback(() => {
    if (isLoading) return
    const nextWebhookUrl = getValues('url')
    if (settings?.webhook.url === nextWebhookUrl) return
    return mutateFormWebhookUrl.mutate(nextWebhookUrl, {
      onError: () => resetField('url'),
    })
  }, [
    getValues,
    isLoading,
    mutateFormWebhookUrl,
    resetField,
    settings?.webhook.url,
  ])

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
      isReadOnly={mutateFormWebhookUrl.isLoading}
      isInvalid={!!errors.url}
    >
      <FormLabel description="For developers and IT officers usage. We will POST encrypted form responses in real-time to the HTTPS endpoint specified here.">
        Endpoint URL
      </FormLabel>
      <Skeleton isLoaded={!isLoading}>
        <InputGroup>
          {mutateFormWebhookUrl.isLoading ? (
            <InputRightElement pointerEvents="none">
              <Spinner />
            </InputRightElement>
          ) : null}
          <Input
            onKeyDown={handleWebhookUrlEnterKeyDown}
            {...register('url', {
              onBlur: handleWebhookInputBlur,
              validate: (url) => {
                return (
                  !url ||
                  validator.isURL(url, {
                    protocols: ['https'],
                    require_protocol: true,
                  }) ||
                  'Please enter a valid URL (starting with https://)'
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
