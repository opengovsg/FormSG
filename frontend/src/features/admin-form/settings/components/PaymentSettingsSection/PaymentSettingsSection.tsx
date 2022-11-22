import { Flex, Icon, Skeleton, Text } from '@chakra-ui/react'

import { BxsCheckCircle, BxsError } from '~assets/icons'

import { useAdminFormPayments, useAdminFormSettings } from '../../queries'

import { StripeConnectButton } from './StripeConnectButton'

const PaymentsAccountValidation = () => {
  const { isLoading, isError } = useAdminFormPayments()

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

  // TODO: Add validation for connected stripe account, depending on a variety of factors.
  // Factors can be whether the account is connected, whether the account is verified, whether the account is in test mode, etc.
  // Factors can be found here: https://stripe.com/docs/api/accounts/object#account_object-requirements

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

const PaymentsSectionText = () => {
  const { data: settings, isLoading } = useAdminFormSettings()

  if (settings?.payments?.enabled && settings?.payments?.target_account_id) {
    return <PaymentsAccountValidation />
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
