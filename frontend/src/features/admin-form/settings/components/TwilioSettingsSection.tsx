import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormControl, Skeleton, Stack, Text } from '@chakra-ui/react'
import { get, isEmpty } from 'lodash'

import { TwilioCredentials } from '~shared/types/twilio'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateFormSettings } from '../mutations'

import { DeleteTwilioModal } from './DeleteTwilioModal'

export const TwilioSettingsSection = (): JSX.Element => {
  const { data: form } = useAdminForm()
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
        <TwilioDetailsInput credentialsExist={!!form?.msgSrvcName} />
      </Skeleton>
    </>
  )
}

interface TwilioDetailsInputProps {
  credentialsExist: boolean
}
const TwilioDetailsInput = ({
  credentialsExist,
}: TwilioDetailsInputProps): JSX.Element => {
  const {
    control,
    reset,
    formState: { errors },
    handleSubmit,
    getValues,
    setValue,
  } = useForm({
    mode: 'onChange',
    defaultValues: credentialsExist
      ? {
          accountSid: 'AC12345678',
          apiKeySid: 'SK12345678',
          apiKeySecret: '12345678',
          messagingServiceSid: 'MG12345678',
          isDisabled: credentialsExist,
        }
      : {
          accountSid: '',
          apiKeySid: '',
          apiKeySecret: '',
          messagingServiceSid: '',
          isDisabled: credentialsExist,
        },
  })

  const [isOpen, setOpen] = useState<boolean>(false)

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

  return (
    <Stack spacing="2rem">
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
              isDisabled={getValues('isDisabled')}
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
              isDisabled={getValues('isDisabled')}
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
              isDisabled={getValues('isDisabled')}
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
              isDisabled={getValues('isDisabled')}
            />
          )}
        />
        <FormErrorMessage>
          {get(errors, 'messagingServiceSid.message')}
        </FormErrorMessage>
      </FormControl>
      <Skeleton isLoaded={true} my="2rem">
        {getValues('isDisabled') ? (
          <Text
            color="#C05050"
            as="u"
            onClick={() => {
              setOpen(true)
            }}
          >
            Remove and Delete Twilio Credentials
          </Text>
        ) : (
          <Button
            onClick={handleSubmit(
              ({
                apiKeySecret,
                apiKeySid,
                accountSid,
                messagingServiceSid,
              }) => {
                const credentials: TwilioCredentials = {
                  apiSecret: apiKeySecret,
                  apiKey: apiKeySid,
                  accountSid,
                  messagingServiceSid,
                }
                mutateFormTwilioDetails.mutate(credentials)
                setValue('isDisabled', true)
              },
            )}
          >
            Save credentials
          </Button>
        )}
      </Skeleton>
      <DeleteTwilioModal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        reset={reset}
      />
    </Stack>
  )
}
