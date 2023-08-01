import { Stack, Text } from '@chakra-ui/react'

import { PaymentDto } from '~shared/types'

export const CompletedPaymentSummary = (payment: PaymentDto) => {
  return (
    <Stack>
      <Text textStyle="h4">Payment summary</Text>
    </Stack>
  )
}
