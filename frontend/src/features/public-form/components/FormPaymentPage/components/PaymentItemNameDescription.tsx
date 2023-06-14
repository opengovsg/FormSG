import { Box, Text } from '@chakra-ui/react'

export interface PaymentItemNameDescriptionProps {
  paymentItemName: string | undefined
  paymentDescription: string | undefined
}
const PaymentItemNameDescription = ({
  paymentItemName,
  paymentDescription,
}: PaymentItemNameDescriptionProps) => (
  <Box mb="0.75rem">
    {paymentItemName ? (
      <Text textStyle="subhead-1">{paymentItemName}</Text>
    ) : null}
    {paymentDescription ? (
      <Text textStyle="body-2">{paymentDescription}</Text>
    ) : null}
  </Box>
)

export default PaymentItemNameDescription
