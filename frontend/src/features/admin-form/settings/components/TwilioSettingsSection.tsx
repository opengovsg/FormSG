import { KeyboardEventHandler, useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormControl, Skeleton, Stack, Text } from '@chakra-ui/react'
import { get, isEmpty } from 'lodash'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'

import { useMutateFormSettings } from '../mutations'

export const TwilioSettingsSection = (): JSX.Element => {
  return (
    <>
      <Text mb="1rem">
        Add your Twilio credentials to pay for Verified SMSes beyond the free
        tier of 10,000 SMSes. How to find your credentials ↪
      </Text>
      <InlineMessage mb="1rem">
        To verify your credentials are correct, please test it in your form
        before activating.
      </InlineMessage>
      <Skeleton isLoaded={true}>
        <Stack spacing="2rem">
          <TwilioDetailsInput
            accountSid={'AC12345678'}
            apiKeySid={'SK12345678'}
            apiKeySecret={'CX123456'}
            messagingServiceSid={'MG12345678'}
          />
        </Stack>
      </Skeleton>
    </>
  )
}

interface TwilioDetailsInputProps {
  accountSid: string
  apiKeySid: string
  apiKeySecret: string
  messagingServiceSid: string
}
const TwilioDetailsInput = ({
  accountSid,
  apiKeySid,
  apiKeySecret,
  messagingServiceSid,
}: TwilioDetailsInputProps): JSX.Element => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      accountSid,
      apiKeySid,
      apiKeySecret,
      messagingServiceSid,
    },
  })

  const accountSidRules = useMemo(
    () => ({
      required: 'Account SID is required',
      pattern: {
        value: /^AC/,
        message: 'Account SID must start with AC',
      },
    }),
    [],
  )

  const apiKeySidRules = useMemo(
    () => ({
      required: 'API key SID is required',
      pattern: {
        value: /^SK/,
        message: 'API key SID must start with SK',
      },
    }),
    [],
  )

  const apiKeySecretRules = useMemo(
    () => ({
      required: 'API key Secret is required',
    }),
    [],
  )

  const messagingServiceSidRules = useMemo(
    () => ({
      required: 'Messaging service SID is required',
      pattern: {
        value: /^MG/,
        message: 'Messaging service SID must start with MG',
      },
    }),
    [],
  )

  const { mutateFormTwilioDetails } = useMutateFormSettings()

  const handleBlur = useCallback(() => {
    return handleSubmit(
      ({ accountSid, apiKeySid, apiKeySecret, messagingServiceSid }) => {
        if (!accountSid) return

        console.log(accountSid, apiKeySid, apiKeySecret, messagingServiceSid)
        mutateFormTwilioDetails.mutate(
          {
            accountSid,
            apiKeySid,
            apiKeySecret,
            messagingServiceSid,
          },
          { onError: () => reset() },
        )
      },
      () => reset(),
    )()
  }, [
    handleSubmit,
    accountSid,
    apiKeySid,
    apiKeySecret,
    messagingServiceSid,
    mutateFormTwilioDetails,
    reset,
  ])

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleBlur()
      }
    },
    [handleBlur],
  )

  return (
    <>
      <FormControl isInvalid={!isEmpty(errors.accountSid)}>
        <FormLabel isRequired>Account SID</FormLabel>
        <Controller
          control={control}
          name="accountSid"
          rules={accountSidRules}
          render={({ field }) => (
            <Input
              {...field}
              type="password"
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          )}
        />
        <FormErrorMessage>{get(errors, 'accountSid.message')}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!isEmpty(errors.apiKeySid)}>
        <FormLabel isRequired>API Key SID</FormLabel>
        <Controller
          control={control}
          name="apiKeySid"
          rules={apiKeySidRules}
          render={({ field }) => (
            <Input
              {...field}
              type="password"
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          )}
        />
        <FormErrorMessage>{get(errors, 'apiKeySid.message')}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!isEmpty(errors.apiKeySecret)}>
        <FormLabel isRequired>API key secret</FormLabel>
        <Controller
          control={control}
          name="apiKeySecret"
          rules={apiKeySecretRules}
          render={({ field }) => (
            <Input
              {...field}
              type="password"
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          )}
        />
        <FormErrorMessage>
          {get(errors, 'apiKeySecret.message')}
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!isEmpty(errors.messagingServiceSid)}>
        <FormLabel isRequired>Messaging service SID</FormLabel>
        <Controller
          control={control}
          name="messagingServiceSid"
          rules={messagingServiceSidRules}
          render={({ field }) => (
            <Input
              {...field}
              type="password"
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          )}
        />
        <FormErrorMessage>
          {get(errors, 'messagingServiceSid.message')}
        </FormErrorMessage>
      </FormControl>
      <Text
        color="#C05050"
        as="u"
        onClick={() =>
          reset({
            accountSid: '',
            apiKeySid: '',
            apiKeySecret: '',
            messagingServiceSid: '',
          })
        }
      >
        Remove and Delete Twilio Credentials
      </Text>
    </>
  )
}
