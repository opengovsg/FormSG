import { RegisterOptions, useForm } from 'react-hook-form'
import { Box, FormControl, Stack, Text, useDisclosure } from '@chakra-ui/react'

import { TwilioCredentials } from '~shared/types/twilio'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

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
export const TwilioDetailsInput = ({
  hasExistingTwilioCreds,
}: TwilioDetailsInputProps): JSX.Element => {
  const {
    register,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm<TwilioCredentials>()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const { mutateFormTwilioDetails } = useMutateTwilioCreds()

  const handleUpdateTwilioDetails = handleSubmit((credentials) => {
    return mutateFormTwilioDetails.mutate(credentials)
  })

  return (
    <form onSubmit={handleUpdateTwilioDetails} noValidate>
      <Stack spacing="2rem">
        <FormControl isInvalid={!!errors.accountSid}>
          <FormLabel isRequired>Account SID</FormLabel>
          <Input {...register('accountSid', TWILIO_INPUT_RULES.accountSid)} />
          <FormErrorMessage>{errors.accountSid?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.apiKey}>
          <FormLabel isRequired>API Key SID</FormLabel>
          <Input {...register('apiKey', TWILIO_INPUT_RULES.apiKey)} />
          <FormErrorMessage>{errors.apiKey?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.apiSecret}>
          <FormLabel isRequired>API key secret</FormLabel>
          <Input {...register('apiSecret', TWILIO_INPUT_RULES.apiSecret)} />
          <FormErrorMessage>{errors.apiSecret?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.messagingServiceSid}>
          <FormLabel isRequired>Messaging service SID</FormLabel>
          <Input
            {...register(
              'messagingServiceSid',
              TWILIO_INPUT_RULES.messagingServiceSid,
            )}
          />
          <FormErrorMessage>
            {errors.messagingServiceSid?.message}
          </FormErrorMessage>
        </FormControl>
      </Stack>
      <Box mt="2.5rem">
        {hasExistingTwilioCreds ? (
          <Text color="#C05050" as="u" onClick={onOpen}>
            Remove and Delete Twilio Credentials
          </Text>
        ) : (
          <Button type="submit">Save credentials</Button>
        )}
      </Box>
      <DeleteTwilioModal isOpen={isOpen} onClose={onClose} reset={reset} />
    </form>
  )
}
