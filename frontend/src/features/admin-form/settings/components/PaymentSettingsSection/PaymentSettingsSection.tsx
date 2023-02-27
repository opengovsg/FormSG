import { Flex, FormControl, Icon, Skeleton, Text } from '@chakra-ui/react'

import { BxsCheckCircle, BxsError, BxsInfoCircle } from '~assets/icons'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useAdminFormPayments, useAdminFormSettings } from '../../queries'

import { StripeConnectButton } from './StripeConnectButton'

const PaymentsAccountValidation = () => {
  const { hasPaymentCapabilities, isLoading, isError } = useAdminFormPayments()

  if (isError) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <Flex mb="2.5rem">
          <Icon
            aria-hidden
            marginEnd="0.5em"
            color="danger.500"
            fontSize="1rem"
            h="1.5rem"
            as={BxsError}
            mr={2}
          />
          <Text>
            Something went wrong when validating the connected Stripe account
          </Text>
        </Flex>
      </Skeleton>
    )
  }

  if (hasPaymentCapabilities) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <Flex mb="2.5rem">
          <Icon
            aria-hidden
            marginEnd="0.5em"
            color="success.500"
            fontSize="1rem"
            h="1.5rem"
            as={BxsCheckCircle}
            mr={2}
          />
          <Text>Your Stripe account is linked to FormSG</Text>
        </Flex>
      </Skeleton>
    )
  }

  // Linked account has no payment capabilities.
  return (
    <Skeleton isLoaded={!isLoading}>
      <Flex mb="2.5rem">
        <Icon
          aria-hidden
          marginEnd="0.5em"
          color="warning.500"
          fontSize="1rem"
          h="1.5rem"
          as={BxsInfoCircle}
          mr={2}
        />
        <Text>
          The connected account does not have the ability to process payments.
        </Text>
      </Flex>
    </Skeleton>
  )
}

const PaymentsAccountInformation = () => {
  const { data: settings, isLoading } = useAdminFormSettings()

  return (
    <Skeleton isLoaded={!isLoading}>
      <FormControl mb="2.5rem">
        <FormLabel mb="0.75rem" isRequired>
          <Text textStyle="subhead-1">Target Account ID</Text>
          <Text textStyle="body-2" textColor="secondary.400">
            This is the account ID connected to this form.
          </Text>
        </FormLabel>
        <Input
          isDisabled={true}
          value={settings?.payments?.target_account_id}
        ></Input>
      </FormControl>
    </Skeleton>
  )
}

const PaymentsSectionText = () => {
  const { data: settings, isLoading } = useAdminFormSettings()

  if (settings?.payments?.enabled && settings?.payments?.target_account_id) {
    return (
      <>
        <PaymentsAccountValidation />
        <PaymentsAccountInformation />
      </>
    )
  }

  return (
    <Skeleton isLoaded={!isLoading} mb="2.5rem">
      <Text>
        Link your form to a Stripe account to start collecting payments.
      </Text>
    </Skeleton>
  )
}

export const PaymentSettingsSection = (): JSX.Element => {
  return (
    <>
      <PaymentsSectionText />
      <StripeConnectButton />
    </>
  )
}
