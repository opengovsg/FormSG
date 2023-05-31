import { Box, Text } from '@chakra-ui/react'

import { FormColorTheme, FormPaymentsFieldV1 } from '~shared/types'

import { centsToDollars } from '~utils/payments'

const PaymentItem = ({
  paymentItemName,
  paymentAmount,
  colorTheme,
}: {
  paymentItemName: string
  paymentAmount: number
  colorTheme: FormColorTheme
}) => {
  return (
    <Box
      backgroundColor={`theme-${colorTheme}.100`}
      borderWidth="1px"
      borderColor={`theme-${colorTheme}.300`}
      borderRadius="4px"
      p="0.7rem"
    >
      <Text textStyle="body-1" mb="0.5rem">
        {paymentItemName}
      </Text>
      <Box as="h2" textStyle="h2">{`${centsToDollars(
        paymentAmount ?? 0,
      )} SGD`}</Box>
    </Box>
  )
}

export const PaymentItemDetailsBlock = ({
  paymentDetails,
  colorTheme,
}: {
  paymentDetails: FormPaymentsFieldV1
  colorTheme: FormColorTheme
}) => {
  return (
    <PaymentItem
      paymentItemName={paymentDetails.description || ''}
      paymentAmount={paymentDetails.amount_cents || 0}
      colorTheme={colorTheme}
    />
  )
}
