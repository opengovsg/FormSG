import { Suspense, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Code, Flex, Skeleton } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import { CreatePaymentIntentFailureBlock } from '~features/payment/components/CreatePaymentIntentFailureBlock'

import { DownloadReceiptBlock } from '../components/DownloadReceiptBlock'
import { PaymentSuccessSvgr } from '../components/PaymentSuccessSvgr'
import {
  useGetPaymentInfo,
  useGetPaymentReceiptStatusFromStripe,
} from '../queries'

import { StripePaymentModal } from './StripePaymentModal'
import { getPaymentViewType } from './utils'

const StripePaymentWrapper = ({ paymentPageId }: { paymentPageId: string }) => {
  const { data: paymentInfoData, error: paymentInfoError } =
    useGetPaymentInfo(paymentPageId)

  const [debugText, setDebugText] = useState<string>('')
  console.log({ paymentInfoData, paymentInfoError })

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
      options={{
        // passing the client secret obtained from the server
        clientSecret: paymentInfoData.client_secret,
      }}
    >
      <Flex flexDir="column" align="center">
        <Box position={'fixed'} w={'50%'} top={0} left={0}>
          <pre>
            <Code>
              {JSON.stringify(paymentInfoData, null, 2)}
              <br />
              {debugText}
            </Code>
          </pre>
        </Box>
        <Suspense fallback={<span>Loading Stripe Payment</span>}>
          <StripeWrapper
            paymentInfoData={paymentInfoData}
            setDebugText={setDebugText}
          />
        </Suspense>
      </Flex>
    </Elements>
  )
}

const StripeWrapper = ({
  paymentInfoData,
  setDebugText,
}: {
  paymentInfoData: GetPaymentInfoDto
  setDebugText: (text: string) => void
}) => {
  const stripe = useStripe()
  if (!stripe) {
    return <span>loading stripe</span>
  }
  return (
    <StripePaymentContainer
      paymentInfoData={paymentInfoData}
      stripe={stripe}
      setDebugText={setDebugText}
    />
  )
}

/**
 * Handles decision to render StripePaymentModal or StripeReceiptModal
 * @returns
 */
const StripePaymentContainer = ({
  paymentInfoData,
  stripe,
  setDebugText,
}: {
  paymentInfoData: GetPaymentInfoDto
  stripe: Stripe
  setDebugText: (text: string) => void
}) => {
  const { formId, paymentPageId } = useParams()
  // if (!stripe) throw new Error('Stripe is not ready')
  if (!formId) throw new Error('No formId provided')
  if (!paymentPageId) throw new Error('No paymentPageId provided')

  const [refetchKey, setRefetchKey] = useState<number>(0)
  const { data, isLoading, error } = useGetPaymentReceiptStatusFromStripe({
    clientSecret: paymentInfoData.client_secret,
    stripe,
    refetchKey,
  })
  console.log({ isLoading, error, data })

  const viewType = getPaymentViewType(data?.paymentIntent?.status)
  setDebugText(
    JSON.stringify({ viewType, status: data?.paymentIntent?.status }, null, 2),
  )
  let paymentViewElementElement
  switch (viewType) {
    case 'invalid':
      paymentViewElementElement = (
        <CreatePaymentIntentFailureBlock
          submissionId={paymentPageId}
          paymentClientSecret={paymentInfoData.client_secret}
          publishableKey={paymentInfoData.publishableKey}
        />
      )
      break
    case 'canceled':
      paymentViewElementElement = <span>{viewType}</span>
      break
    case 'payment':
      paymentViewElementElement = (
        <StripePaymentModal
          submissionId={paymentPageId}
          paymentClientSecret={paymentInfoData.client_secret}
          publishableKey={paymentInfoData.publishableKey}
          triggerPaymentStatusRefetch={() => setRefetchKey(Date.now())}
        />
      )
      break
    case 'receipt':
      paymentViewElementElement = (
        <DownloadReceiptBlock
          formId={formId}
          stripeSubmissionId={paymentPageId}
        />
      )
      break
  }
  return (
    <>
      <PaymentSuccessSvgr maxW="100%" />
      <Box
        py={{ base: '1.5rem', md: '3rem' }}
        px={{ base: '1.5rem', md: '4rem' }}
        bg="white"
        w="100%"
      >
        <Skeleton isLoaded={!isLoading}>{paymentViewElementElement}</Skeleton>
      </Box>
    </>
  )
}

export default StripePaymentWrapper
