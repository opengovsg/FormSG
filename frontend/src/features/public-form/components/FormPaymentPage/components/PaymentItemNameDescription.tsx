import { Box, Text } from '@chakra-ui/react'

import { PaymentItemNameDescriptionProps } from './types'

const PaymentItemNameDescription = ({
  paymentItemName,
  paymentDescription,
}: PaymentItemNameDescriptionProps) => {
  if (!paymentItemName && !paymentDescription) {
    return null
  }
  return (
    <Box mb="0.75rem">
      {paymentItemName ? (
        <Text textStyle="subhead-1">{paymentItemName}</Text>
      ) : null}
      {paymentDescription ? (
        <Text textStyle="body-2">{paymentDescription}</Text>
      ) : null}
    </Box>
  )
}
export default PaymentItemNameDescription
