import { Flex, Icon, Skeleton, Text } from '@chakra-ui/react'

import { BxsCheckCircle } from '~assets/icons'

import { useAdminFormSettings } from '../../queries'

import { StripeConnectButton } from './StripeConnectButton'

const PaymentsSectionText = () => {
  const { data: settings, isLoading } = useAdminFormSettings()

  if (settings?.payments?.enabled && settings?.payments?.target_account_id) {
    return (
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
