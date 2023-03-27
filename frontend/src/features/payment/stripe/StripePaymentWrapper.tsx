import { Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Code, Flex, Skeleton } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import { PaymentSuccessSvgr } from '../FormPaymentRedirectPage/components/PaymentSuccessSvgr'
import {
  useGetPaymentInfo,
  useGetPaymentReceiptStatusFromStripe,
} from '../queries'

import { StripePaymentModal } from './StripePaymentModal'
import { getPaymentViewType } from './utils'

const StripePaymentWrapper = ({ paymentPageId }: { paymentPageId: string }) => {
  const { data: paymentInfoData, error: paymentInfoError } =
    useGetPaymentInfo(paymentPageId)

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
        <Code>{JSON.stringify(paymentInfoData, null, 2)}</Code>
        <Suspense fallback={<span>Loading Stripe Payment</span>}>
          <StripeWrapper paymentInfoData={paymentInfoData} />
        </Suspense>
      </Flex>
    </Elements>
  )
}

const StripeWrapper = ({
  paymentInfoData,
}: {
  paymentInfoData: GetPaymentInfoDto
}) => {
  const stripe = useStripe()
  if (!stripe) {
    return <span>loading stripe</span>
  }
  return (
    <StripePaymentContainer paymentInfoData={paymentInfoData} stripe={stripe} />
  )
}

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

  console.log('asd')
  // if (!stripe) throw new Error('Stripe is not ready')
  if (!formId) throw new Error('No formId provided')
  if (!paymentPageId) throw new Error('No paymentPageId provided')

  const { data, isLoading, error } = useGetPaymentReceiptStatusFromStripe(
    paymentInfoData.client_secret,
    stripe,
  )
  console.log({ isLoading, error, data })

  const viewType = getPaymentViewType(data?.paymentIntent?.status)
  let paymentViewElementElement
  switch (viewType) {
    case 'invalid':
      paymentViewElementElement = null
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
        />
      )
      break
    case 'receipt':
      paymentViewElementElement = <span>{viewType}</span>
      //   <DownloadReceiptBlock
      //               formId={formId}
      //               stripeSubmissionId={stripeSubmissionId}
      //             />
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
        <Skeleton isLoaded={!isLoading || viewType === 'invalid'}>
          {paymentViewElementElement}
        </Skeleton>
      </Box>
    </>
  )
}

export default StripePaymentWrapper
