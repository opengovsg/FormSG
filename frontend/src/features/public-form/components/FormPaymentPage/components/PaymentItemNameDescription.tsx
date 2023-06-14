import { Text } from '@chakra-ui/react'

export interface PaymentItemNameDescriptionProps {
  paymentItemName: string | undefined
  paymentDescription: string | undefined
}
const PaymentItemNameDescription = ({
  paymentItemName,
  paymentDescription,
}: PaymentItemNameDescriptionProps) => (
  <>
    <Text textStyle="subhead-1" mb="0.75rem">
      {paymentItemName}
    </Text>
    <Text textStyle="subhead-1" mb="0.75rem">
      {paymentDescription}
    </Text>
  </>
)

export default PaymentItemNameDescription
