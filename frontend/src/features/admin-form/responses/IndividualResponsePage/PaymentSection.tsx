import { Box, Divider, Link, Stack, Text } from '@chakra-ui/react'
import { keyBy } from 'lodash'

import { SubmissionPaymentData } from '~shared/types'

import { getPaymentDataView } from '../common/utils/getPaymentDataView'

const PaymentDataItem = ({
  name,
  value,
  isMonospace,
  isUrl,
}: {
  name: string
  value: string
  isMonospace?: boolean
  isUrl?: boolean
}) => (
  <Stack direction={{ base: 'column', md: 'row' }}>
    <Text textStyle="subhead-1">{name}:</Text>
    <Text
      sx={
        isMonospace
          ? {
              fontFeatureSettings: "'tnum' on, 'lnum' on, 'zero' on, 'cv05' on",
            }
          : {}
      }
    >
      {isUrl ? (
        <Link as="a" href={value} target="_blank">
          {value}
        </Link>
      ) : (
        value
      )}
    </Text>
  </Stack>
)

export const PaymentSection = ({
  payment,
}: {
  payment: SubmissionPaymentData
}): JSX.Element | null => {
  if (!payment) return null

  const displayPayoutSection = payment.payoutId || payment.payoutDate

  const paymentDataMap = keyBy(getPaymentDataView(payment), 'key')

  return (
    <Stack>
      <Text
        textStyle="h2"
        as="h2"
        color="primary.500"
        mb="0.5rem"
        _notFirst={{ mt: '2.5rem' }}
      >
        Payment details
      </Text>
      <Stack>
        <PaymentDataItem {...paymentDataMap['email']} />
        <PaymentDataItem {...paymentDataMap['receiptUrl']} isUrl />
        <Box py="0.75rem">
          <Divider />
        </Box>
        <PaymentDataItem {...paymentDataMap['paymentIntentId']} isMonospace />
        <PaymentDataItem {...paymentDataMap['amount']} />
        <PaymentDataItem {...paymentDataMap['transactionFee']} />
        <PaymentDataItem {...paymentDataMap['status']} />
        <PaymentDataItem {...paymentDataMap['paymentDate']} />
        {displayPayoutSection && (
          <>
            <Box py="0.75rem">
              <Divider />
            </Box>
            <PaymentDataItem {...paymentDataMap['payoutId']} isMonospace />
            <PaymentDataItem {...paymentDataMap['payoutDate']} />
          </>
        )}
      </Stack>
    </Stack>
  )
}
