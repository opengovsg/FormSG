import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { get, isEmpty } from 'lodash'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

export const TwilioSettingsSection = (): JSX.Element => {
  return (
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

  return (
    <>
      <FormControl isInvalid={!isEmpty(errors.accountSid)}>
        <FormLabel isRequired>Account SID</FormLabel>
        <Controller
          control={control}
          name="accountSid"
          rules={accountSidRules}
          render={({ field }) => <Input {...field} type="password" />}
        />
        <FormErrorMessage>{get(errors, 'accountSid.message')}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!isEmpty(errors.apiKeySid)}>
        <FormLabel isRequired>API Key SID</FormLabel>
        <Controller
          control={control}
          name="apiKeySid"
          rules={apiKeySidRules}
          render={({ field }) => <Input {...field} type="password" />}
        />
        <FormErrorMessage>{get(errors, 'apiKeySid.message')}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!isEmpty(errors.apiKeySecret)}>
        <FormLabel isRequired>API key secret</FormLabel>
        <Controller
          control={control}
          name="apiKeySecret"
          rules={apiKeySecretRules}
          render={({ field }) => <Input {...field} type="password" />}
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
          render={({ field }) => <Input {...field} type="password" />}
        />
        <FormErrorMessage>
          {get(errors, 'messagingServiceSid.message')}
        </FormErrorMessage>
      </FormControl>
    </>
  )
}
