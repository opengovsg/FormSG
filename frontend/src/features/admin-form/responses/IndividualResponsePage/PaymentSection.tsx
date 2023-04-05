import { Stack, Text } from '@chakra-ui/react'

import { StorageModeSubmissionDto } from '~shared/types'

type PaymentDataViewItem = {
  name: string
  value?: string | Date
  isFontMonospace?: boolean
}

export const PaymentSection = ({
  paymentData,
}: {
  paymentData: StorageModeSubmissionDto['payment']
}): JSX.Element | null => {
  if (!paymentData) return null

  const paymentDataView: PaymentDataViewItem[] = [
    {
      name: 'Payment amount',
      value: `S$${(paymentData.amount / 100).toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    { name: "Payer's contact email", value: paymentData.email },
    { name: 'Payment status', value: paymentData.status.toUpperCase() },
    {
      name: 'Payment date',
      value: paymentData.paymentDate,
    },
    {
      name: 'Payment intent ID',
      value: paymentData.paymentIntentId,
      isFontMonospace: true,
    },
    {
      name: 'Transaction fee',
      value: `S$${(paymentData.transactionFee / 100).toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    { name: 'Receipt', value: paymentData.receiptUrl },
    { name: 'Payout ID', value: paymentData.payoutId, isFontMonospace: true },
    {
      name: 'Payout date',
      value: paymentData.payoutDate,
    },
  ]

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
        {paymentDataView.map(
          ({ name, value, isFontMonospace }) =>
            value && (
              <Stack direction={{ base: 'column', md: 'row' }}>
                <Text textStyle="subhead-1">{name}:</Text>
                <Text
                  sx={
                    isFontMonospace
                      ? {
                          fontFeatureSettings:
                            "'tnum' on, 'lnum' on, 'zero' on, 'cv05' on",
                        }
                      : {}
                  }
                >
                  {value}
                </Text>
              </Stack>
            ),
        )}
      </Stack>
    </Stack>
  )
}
