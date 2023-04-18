import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import { CreatePaymentIntentFailureBlock } from '../components/CreatePaymentIntentFailureBlock'
import { PaymentSuccessSvgr } from '../components/PaymentSuccessSvgr'
import { useGetPaymentInfo } from '../queries'

import { StripePaymentBlock } from './components/StripePaymentBlock'
import { useGetPaymentStatusFromStripe } from './stripeQueries'
import { StripeReceiptContainer } from './StripeReceiptContainer'
import { getPaymentViewStates, PaymentViewStates } from './utils'

const StripeElementWrapper = ({ paymentId }: { paymentId: string }) => {
  const { data: paymentInfoData } = useGetPaymentInfo(paymentId)

  if (!paymentInfoData) {
    throw new Error('useGetPaymentInfo not ready')
  }
  const stripePromise = useMemo(
    () => loadStripe(paymentInfoData.publishableKey),
    [paymentInfoData],
  )
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: paymentInfoData.client_secret }}
    >
      <Flex flexDir="column" align="center">
        <StripeHookWrapper paymentInfoData={paymentInfoData} />
      </Flex>
    </Elements>
  )
}

const StripeHookWrapper = ({
  paymentInfoData,
}: {
  paymentInfoData: GetPaymentInfoDto
}) => {
  const stripe = useStripe()
  if (!stripe) {
    throw Promise.reject('Stripe is not ready')
  }
  return (
    <StripePaymentContainer paymentInfoData={paymentInfoData} stripe={stripe} />
  )
}

const PaymentBox = ({ children }: { children: React.ReactNode }) => (
  <Box
    py={{ base: '1.5rem', md: '3rem' }}
    px={{ base: '1.5rem', md: '4rem' }}
    bg="white"
    w="100%"
  >
    {children}
  </Box>
)
/**
 * Handles decision to render StripePaymentModal or StripeReceiptModal
 * @returns
 */
const StripePaymentContainer = ({
  paymentInfoData,
  stripe,
}: {
  paymentInfoData: GetPaymentInfoDto
  stripe: Stripe
}) => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const [refetchKey, setRefetchKey] = useState<number>(0)
  const { data } = useGetPaymentStatusFromStripe({
    clientSecret: paymentInfoData.client_secret,
    stripe,
    refetchKey,
  })

  const viewStates = getPaymentViewStates(data?.paymentIntent?.status)

  switch (viewStates) {
    case PaymentViewStates.Invalid:
      return (
        <PaymentBox>
          <CreatePaymentIntentFailureBlock
            submissionId={paymentInfoData.submissionId}
            paymentClientSecret={paymentInfoData.client_secret}
            publishableKey={paymentInfoData.publishableKey}
          />
        </PaymentBox>
      )
    case PaymentViewStates.Canceled:
      return (
        <PaymentBox>
          <span>{viewStates}</span>
        </PaymentBox>
      )
      break
    case PaymentViewStates.Pending:
      return (
        <PaymentBox>
          <StripePaymentBlock
            submissionId={paymentInfoData.submissionId}
            paymentClientSecret={paymentInfoData.client_secret}
            publishableKey={paymentInfoData.publishableKey}
            triggerPaymentStatusRefetch={() => setRefetchKey(Date.now())}
          />
        </PaymentBox>
      )
    case PaymentViewStates.Succeeded:
      return (
        <>
          <PaymentSuccessSvgr maxW="100%" />
          <PaymentBox>
            <StripeReceiptContainer
              formId={formId}
              paymentId={paymentInfoData.submissionId}
            />
          </PaymentBox>
        </>
      )
    default: {
      // Force TS to emit an error if the cases above are not exhaustive
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = viewStates
      throw new Error(`Undefined view type: ${viewStates}`)
    }
  }
}

export default StripeElementWrapper
