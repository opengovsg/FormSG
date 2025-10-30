import { KeyboardEventHandler, useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  FormControl,
  InputGroup,
  InputRightElement,
  Skeleton,
  useMergeRefs,
} from '@chakra-ui/react'
import validator from 'validator'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Spinner from '~components/Spinner'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const WebhookUrlInput = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.webhooks',
  })
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

  const urlRegister = register('url', {
    onBlur: handleWebhookInputBlur,
    validate: (url) => {
      return (
        !url ||
        validator.isURL(url, {
          protocols: ['https'],
          require_protocol: true,
        }) ||
        t('input.validationError')
      )
    },
  })
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isLoading || !settings) return
    resetField('url', { defaultValue: settings.webhook.url })
  }, [isLoading, resetField, settings])

  const mergedRefs = useMergeRefs(urlRegister.ref, inputRef)

  const handleWebhookUrlEnterKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (!isValid || e.key !== 'Enter') return
      return inputRef.current?.blur()
    },
    [isValid],
  )

  return (
    <FormControl
      isReadOnly={mutateFormWebhookUrl.isLoading}
      isInvalid={!!errors.url}
    >
      <FormLabel description={t('input.description')}>
        {t('input.label')}
      </FormLabel>
      <Skeleton isLoaded={!isLoading}>
        <InputGroup>
          {mutateFormWebhookUrl.isLoading ? (
            <InputRightElement pointerEvents="none">
              <Spinner />
            </InputRightElement>
          ) : null}
          <Input
            placeholder={t('input.placeholder')}
            onKeyDown={handleWebhookUrlEnterKeyDown}
            {...urlRegister}
            ref={mergedRefs}
          />
        </InputGroup>
      </Skeleton>
      <FormErrorMessage>{errors.url?.message}</FormErrorMessage>
    </FormControl>
  )
}
