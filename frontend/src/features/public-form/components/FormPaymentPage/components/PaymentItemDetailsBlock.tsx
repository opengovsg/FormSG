import { Box, Text } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { centsToDollars } from '~utils/payments'

import PaymentItemNameDescription, {
  PaymentItemNameDescriptionProps,
} from './PaymentItemNameDescription'

export interface PaymentItemDetailsBlockProps
  extends PaymentItemNameDescriptionProps {
  colorTheme: FormColorTheme
  paymentAmount: number | undefined
}

export const PaymentItemDetailsBlock = ({
  paymentItemName,
  paymentDescription,
  colorTheme,
  paymentAmount,
}: PaymentItemDetailsBlockProps): JSX.Element => {
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
