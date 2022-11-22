import { Text } from '@chakra-ui/react'

import { StripeConnectButton } from './StripeConnectButton'

export const PaymentSettingsSection = (): JSX.Element => {
  return (
    <>
      <Text mb="1rem">
        Link your form to a Stripe account to start collecting payments.
      </Text>
      <StripeConnectButton />
    </>
  )
}
