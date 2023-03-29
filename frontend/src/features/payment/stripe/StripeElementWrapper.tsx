import React, { useEffect, useMemo, useState } from 'react'
import { ReactElement } from 'react-markdown/lib/react-markdown'
import { useParams } from 'react-router-dom'
import { Box, Code, Flex } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import { CreatePaymentIntentFailureBlock } from '~features/payment/components/CreatePaymentIntentFailureBlock'

import { PaymentSuccessSvgr } from '../components/PaymentSuccessSvgr'
import { useGetPaymentInfo } from '../queries'

import { StripePaymentBlock } from './components/StripePaymentBlock'
import { useGetPaymentStatusFromStripe } from './stripeQueries'
import { StripeReceiptContainer } from './StripeReceiptContainer'
import { getPaymentViewType } from './utils'

const StripeElementWrapper = ({ paymentPageId }: { paymentPageId: string }) => {
  const { data: paymentInfoData } = useGetPaymentInfo(paymentPageId)

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
  const { formId, paymentPageId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!paymentPageId) throw new Error('No paymentPageId provided')

  const [refetchKey, setRefetchKey] = useState<number>(0)
  const { data } = useGetPaymentStatusFromStripe({
    clientSecret: paymentInfoData.client_secret,
    stripe,
    refetchKey,
  })

  const viewType = getPaymentViewType(data?.paymentIntent?.status)

  switch (viewType) {
    case 'invalid':
      return (
        <PaymentBox>
          <CreatePaymentIntentFailureBlock
            submissionId={paymentPageId}
            paymentClientSecret={paymentInfoData.client_secret}
            publishableKey={paymentInfoData.publishableKey}
          />
        </PaymentBox>
      )
    case 'canceled':
      return (
        <PaymentBox>
          <span>{viewType}</span>
        </PaymentBox>
      )
      break
    case 'payment':
      return (
        <PaymentBox>
          <StripePaymentBlock
            submissionId={paymentPageId}
            paymentClientSecret={paymentInfoData.client_secret}
            publishableKey={paymentInfoData.publishableKey}
            triggerPaymentStatusRefetch={() => setRefetchKey(Date.now())}
          />
        </PaymentBox>
      )
    case 'receipt':
      return (
        <>
          <PaymentSuccessSvgr maxW="100%" />
          <PaymentBox>
            <StripeReceiptContainer
              formId={formId}
              paymentPageId={paymentPageId}
            />
          </PaymentBox>
        </>
      )
    default:
      throw new Error(`Undefined view type: ${viewType}`)
  }
}

export default StripeElementWrapper
