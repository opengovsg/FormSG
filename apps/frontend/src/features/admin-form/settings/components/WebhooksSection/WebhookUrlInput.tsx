import { KeyboardEventHandler, useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiX } from 'react-icons/bi'
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
import IconButton from '~components/IconButton'
import Input from '~components/Input'
import Spinner from '~components/Spinner'
import Tooltip from '~components/Tooltip'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

const ClearWebhookRightButton = ({
  isLoading,
  onClick,
}: {
  isLoading: boolean
  onClick: () => void
}) => {
  const { t } = useTranslation()
  const removeLabel = t('features.adminForm.settings.webhooks.remove')

  return (
    <InputRightElement>
      <Tooltip label={removeLabel} placement="top">
        <IconButton
          type="button"
          variant="inputAttached"
          aria-label={removeLabel}
          icon={<BiX />}
          bg="white"
          borderLeftRadius={0}
          borderLeftColor="neutral.400"
          _hover={{ bg: 'white' }}
          ml={0}
          minW="2.75rem"
          h="2.75rem"
          isLoading={isLoading}
          isDisabled={isLoading}
          onClick={onClick}
        />
      </Tooltip>
    </InputRightElement>
  )
}

export const WebhookUrlInput = ({
  isDisabled = false,
  canRemove = false,
}: {
  isDisabled?: boolean
  canRemove?: boolean
}): JSX.Element => {
  const { t } = useTranslation()
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
    if (isLoading || isDisabled) return
    const nextWebhookUrl = getValues('url')
    if (settings?.webhook.url === nextWebhookUrl) return
    return mutateFormWebhookUrl.mutate(nextWebhookUrl, {
      onError: () => resetField('url'),
    })
  }, [
    getValues,
    isDisabled,
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
        'Please enter a valid URL (starting with https://)'
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

  const showRemove = canRemove && !!settings?.webhook.url

  return (
    <FormControl
      isReadOnly={mutateFormWebhookUrl.isLoading}
      isInvalid={!!errors.url}
    >
      <FormLabel
        description={t(
          'features.adminForm.settings.webhooks.input.description',
        )}
      >
        {t('features.adminForm.settings.webhooks.input.label')}
      </FormLabel>
      <Skeleton isLoaded={!isLoading}>
        <InputGroup>
          <Input
            isDisabled={isDisabled}
            hasInputRightElement={showRemove || mutateFormWebhookUrl.isLoading}
            placeholder={
              isDisabled ? undefined : 'https://your-webhook.com/url'
            }
            onKeyDown={handleWebhookUrlEnterKeyDown}
            {...urlRegister}
            ref={mergedRefs}
          />
          {showRemove ? (
            <ClearWebhookRightButton
              isLoading={mutateFormWebhookUrl.isLoading}
              onClick={() => mutateFormWebhookUrl.mutate('')}
            />
          ) : mutateFormWebhookUrl.isLoading ? (
            <InputRightElement pointerEvents="none">
              <Spinner />
            </InputRightElement>
          ) : null}
        </InputGroup>
      </Skeleton>
      <FormErrorMessage>{errors.url?.message}</FormErrorMessage>
    </FormControl>
  )
}
