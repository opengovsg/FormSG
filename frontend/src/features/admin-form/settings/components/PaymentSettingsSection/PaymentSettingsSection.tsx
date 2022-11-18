import { Text } from '@chakra-ui/react'

import { StripeConnectButton } from './StripeConnectButton'

export const PaymentSettingsSection = (): JSX.Element => {
  return (
    <>
      <Text mb="1rem">Yo some instructions about Stripe</Text>
      <StripeConnectButton />
    </>
  )
}
