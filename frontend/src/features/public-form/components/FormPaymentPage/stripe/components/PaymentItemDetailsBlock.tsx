import { Box, Text } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { centsToDollars } from '~utils/payments'

export interface PaymentItemDetailsBlockProps {
  paymentItemName: string | undefined
  colorTheme: FormColorTheme
  paymentAmount: number | undefined
}

export const PaymentItemDetailsBlock = ({
  paymentItemName,
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
      <Text textStyle="body-1" mb="0.75rem">
        {paymentItemName}
      </Text>
      <Box as="h2" textStyle="h2">
        S${centsToDollars(paymentAmount ?? 0)}
      </Box>
    </Box>
  )
}
