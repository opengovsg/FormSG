import { useCallback, useMemo } from 'react'
import {
  RegisterOptions,
  useForm,
  UseFormRegisterReturn,
} from 'react-hook-form'
import { FormControl, Skeleton, Stack, useDisclosure } from '@chakra-ui/react'

import { TwilioCredentials } from '~shared/types/twilio'

import { trimStringsInObject } from '~utils/trimStringsInObject'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input, { InputProps } from '~components/Input'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateTwilioCreds } from '../../mutations'

import { DeleteTwilioModal } from './DeleteTwilioModal'

const TWILIO_INPUT_RULES: Record<keyof TwilioCredentials, RegisterOptions> = {
  accountSid: {
    required: 'Account SID is required',
    pattern: {
      value: /^AC/,
      message: 'Account SID must start with AC',
    },
    validate: {
      noWhitespace: (value) =>
        !value.trim().match(/\s/) || 'Account SID must not contain whitespace',
    },
  },
  apiKey: {
    required: 'API key SID is required',
    pattern: {
      value: /^SK/,
      message: 'API key SID must start with SK',
    },
    validate: {
      noWhitespace: (value) =>
        !value.trim().match(/\s/) || 'API key SID must not contain whitespace',
    },
  },
  apiSecret: {
    required: 'API key secret is required',
    validate: {
      noWhitespace: (value) =>
        !value.trim().match(/\s/) ||
        'API key secret must not contain whitespace',
    },
  },
  messagingServiceSid: {
    required: 'Messaging service SID is required',
    pattern: {
      value: /^MG/,
      message: 'Messaging service SID must start with MG',
    },
    validate: {
      noWhitespace: (value) =>
        !value.trim().match(/\s/) ||
        'Messaging service SID must not contain whitespace',
    },
  },
}

export const TwilioDetailsInputs = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()

  const hasExistingTwilioCreds = useMemo(
    () => !!form?.msgSrvcName,
    [form?.msgSrvcName],
  )

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<TwilioCredentials>({
    mode: 'onTouched',
    defaultValues: {
      accountSid: hasExistingTwilioCreds ? '********************' : '',
      apiKey: hasExistingTwilioCreds ? '********************' : '',
      apiSecret: hasExistingTwilioCreds ? '********************' : '',
      messagingServiceSid: hasExistingTwilioCreds ? '********************' : '',
    },
  })

  const { isOpen, onOpen, onClose } = useDisclosure()

  const { mutateFormTwilioDetails } = useMutateTwilioCreds()

  const handleUpdateTwilioDetails = handleSubmit((credentials) => {
    if (!form) return
    return mutateFormTwilioDetails.mutate(trimStringsInObject(credentials), {
      onSuccess: () => reset(),
    })
  })

  const registerPropsOrDisabled = useCallback(
    (name: keyof TwilioCredentials): UseFormRegisterReturn | InputProps => {
      if (hasExistingTwilioCreds) {
        return {
          isDisabled: true,
          placeholder: '********************',
        }
      }

      return register(name, TWILIO_INPUT_RULES[name])
    },
    [hasExistingTwilioCreds, register],
  )

  return (
    <>
      <Stack spacing="2rem">
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.accountSid}
        >
          <FormLabel isRequired>Account SID</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input {...registerPropsOrDisabled('accountSid')} />
          </Skeleton>
          <FormErrorMessage>{errors.accountSid?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.apiKey}
        >
          <FormLabel isRequired>API Key SID</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input {...registerPropsOrDisabled('apiKey')} />
          </Skeleton>
          <FormErrorMessage>{errors.apiKey?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.apiSecret}
        >
          <FormLabel isRequired>API key secret</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input {...registerPropsOrDisabled('apiSecret')} />
          </Skeleton>
          <FormErrorMessage>{errors.apiSecret?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.messagingServiceSid}
        >
          <FormLabel isRequired>Messaging service SID</FormLabel>
          <Skeleton isLoaded={!isLoading}>
            <Input {...registerPropsOrDisabled('messagingServiceSid')} />
          </Skeleton>
          <FormErrorMessage>
            {errors.messagingServiceSid?.message}
          </FormErrorMessage>
        </FormControl>
      </Stack>
      <Skeleton isLoaded={!isLoading} mt="2.5rem" w="fit-content">
        {hasExistingTwilioCreds ? (
          <Button variant="link" colorScheme="danger" onClick={onOpen}>
            Remove and re-enter credentials
          </Button>
        ) : (
          <Button
            isLoading={mutateFormTwilioDetails.isLoading}
            onClick={handleUpdateTwilioDetails}
          >
            Save credentials
          </Button>
        )}
      </Skeleton>
      <DeleteTwilioModal isOpen={isOpen} onClose={onClose} onDelete={reset} />
    </>
  )
}
