import { Box } from '@chakra-ui/react'

import { centsToDollars } from '~shared/utils/payments'

import PaymentItemNameDescription from './PaymentItemNameDescription'
import { FixedItemDetailProps } from './types'

export const PaymentItemDetailsBlock = ({
  paymentItemName,
  paymentDescription,
  colorTheme,
  paymentAmount,
}: FixedItemDetailProps): JSX.Element => {
  return (
    <Box
      backgroundColor={`theme-${colorTheme}.100`}
      borderWidth="1px"
      borderColor={`theme-${colorTheme}.300`}
      borderRadius="4px"
      p="0.7rem"
    >
      <PaymentItemNameDescription
        paymentDescription={paymentDescription}
        paymentItemName={paymentItemName}
      />
      <Box as="h2" textStyle="h2">
        S${centsToDollars(paymentAmount ?? 0)}
      </Box>
    </Box>
  )
}
