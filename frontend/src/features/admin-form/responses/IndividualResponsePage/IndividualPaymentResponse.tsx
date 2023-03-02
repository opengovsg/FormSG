import { Stack, Text } from '@chakra-ui/react'

import { useIndividualPaymentSubmission } from './queries'

export const IndividualPaymentResponse = (submissionId: {
  submissionId: string
}): JSX.Element => {
  if (!submissionId) throw new Error('Missing submissionId')

  // TODO: get paymentData from IndividualResponsePage through submission endpoint
  const { data: paymentData } = useIndividualPaymentSubmission()

  return (
    <Stack>
      <Text
        textStyle="h2"
        as="h2"
        color="primary.500"
        mb="0.5rem"
        _notFirst={{ mt: '2.5rem' }}
      >
        Payment
      </Text>
      {paymentData ? (
        <>
          <Stack>
            <Stack direction={{ base: 'column', md: 'row' }}>
              <Text textStyle="subhead-1">Payment amount:</Text>
              <Text>
                S$
                {(paymentData.amount / 100).toLocaleString('en-GB', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </Stack>
            <Stack direction={{ base: 'column', md: 'row' }}>
              <Text textStyle="subhead-1">Payment status:</Text>
              <Text>{paymentData.status.toUpperCase()}</Text>
            </Stack>
            <Stack direction={{ base: 'column', md: 'row' }}>
              <Text textStyle="subhead-1">Payment date:</Text>
              <Text>
                {new Intl.DateTimeFormat('en-GB', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                  timeZoneName: 'shortOffset',
                }).format(new Date(paymentData.created))}
              </Text>
            </Stack>
            <Stack direction={{ base: 'column', md: 'row' }}>
              <Text textStyle="subhead-1">Payment intent ID:</Text>
              <Text>{paymentData.paymentIntentId}</Text>
            </Stack>
            <Stack direction={{ base: 'column', md: 'row' }}>
              <Text textStyle="subhead-1">Transaction fee:</Text>
              {/* TODO: Change this to actual transaction fee once application fee object has been added */}
              <Text>$0.06</Text>
            </Stack>
          </Stack>
        </>
      ) : (
        <Text>Payment data not found</Text>
      )}
    </Stack>
  )
}
