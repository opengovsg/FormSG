import { useCallback } from 'react'
import {
  RegisterOptions,
  useForm,
  UseFormRegisterReturn,
} from 'react-hook-form'
import { Box, FormControl, Stack, useDisclosure } from '@chakra-ui/react'

import { TwilioCredentials } from '~shared/types/twilio'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input, { InputProps } from '~components/Input'

import { useMutateTwilioCreds } from '../../mutations'

import { DeleteTwilioModal } from './DeleteTwilioModal'

const TWILIO_INPUT_RULES: Record<keyof TwilioCredentials, RegisterOptions> = {
  accountSid: {
    required: 'Account SID is required',
    pattern: {
      value: /^AC/,
      message: 'Account SID must start with AC',
    },
  },
  apiKey: {
    required: 'API key SID is required',
    pattern: {
      value: /^SK/,
      message: 'API key SID must start with SK',
    },
  },
  apiSecret: {
    required: 'API key secret is required',
  },
  messagingServiceSid: {
    required: 'Messaging service SID is required',
    pattern: {
      value: /^MG/,
      message: 'Messaging service SID must start with MG',
    },
  },
}

interface TwilioDetailsInputProps {
  hasExistingTwilioCreds: boolean
}
export const TwilioDetailsInputs = ({
  hasExistingTwilioCreds,
}: TwilioDetailsInputProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<TwilioCredentials>()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const { mutateFormTwilioDetails } = useMutateTwilioCreds()

  const handleUpdateTwilioDetails = handleSubmit((credentials) => {
    return mutateFormTwilioDetails.mutate(credentials)
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
          <Input {...registerPropsOrDisabled('accountSid')} />
          <FormErrorMessage>{errors.accountSid?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.apiKey}
        >
          <FormLabel isRequired>API Key SID</FormLabel>
          <Input {...registerPropsOrDisabled('apiKey')} />
          <FormErrorMessage>{errors.apiKey?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.apiSecret}
        >
          <FormLabel isRequired>API key secret</FormLabel>
          <Input {...registerPropsOrDisabled('apiSecret')} />
          <FormErrorMessage>{errors.apiSecret?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={mutateFormTwilioDetails.isLoading}
          isInvalid={!!errors.messagingServiceSid}
        >
          <FormLabel isRequired>Messaging service SID</FormLabel>
          <Input {...registerPropsOrDisabled('messagingServiceSid')} />
          <FormErrorMessage>
            {errors.messagingServiceSid?.message}
          </FormErrorMessage>
        </FormControl>
      </Stack>
      <Box mt="2.5rem">
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
      </Box>
      <DeleteTwilioModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
