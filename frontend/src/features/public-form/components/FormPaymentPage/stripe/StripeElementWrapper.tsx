import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import { CreatePaymentIntentFailureBlock } from '../components/CreatePaymentIntentFailureBlock'
import { PaymentSuccessSvgr } from '../components/PaymentSuccessSvgr'
import { useGetPaymentInfo } from '../queries'

import {
  GenericMessageBlock,
  PaymentStack,
  StripePaymentBlock,
} from './components'
import { useGetPaymentStatusFromStripe } from './queries'
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
        <StripePaymentContainer paymentInfoData={paymentInfoData} />
      </Flex>
    </Elements>
  )
}

/**
 * Handles the presentational logic for stripe payment flow
 * @param paymentInfoData
 * @returns
 */
const StripePaymentContainer = ({
  paymentInfoData,
}: {
  paymentInfoData: GetPaymentInfoDto
}) => {
  const { formId, paymentId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!paymentId) throw new Error('No paymentId provided')

  const stripe = useStripe()
  if (!stripe) throw Promise.reject('Stripe is not ready')

  const [refetchKey, setRefetchKey] = useState<number>(0)
  const { data } = useGetPaymentStatusFromStripe({
    clientSecret: paymentInfoData.client_secret,
    stripe,
    refetchKey,
  })

  const viewStates = getPaymentViewStates(data?.paymentIntent?.status)

  const renderViewState = () => {
    switch (viewStates) {
      case PaymentViewStates.Invalid:
        return (
          <PaymentStack>
            <CreatePaymentIntentFailureBlock
              submissionId={paymentId}
              paymentClientSecret={paymentInfoData.client_secret}
              publishableKey={paymentInfoData.publishableKey}
            />
          </PaymentStack>
        )
      case PaymentViewStates.Canceled:
        return (
          <PaymentStack>
            <GenericMessageBlock
              paymentId={paymentId}
              title={'Payment request was canceled.'}
              subtitle={
                'The payment request has been canceled. If any payment has been completed, the payment will be refunded.'
              }
            />
          </PaymentStack>
        )
      case PaymentViewStates.PendingPayment:
        return (
          <PaymentStack>
            <StripePaymentBlock
              submissionId={paymentId}
              paymentClientSecret={paymentInfoData.client_secret}
              publishableKey={paymentInfoData.publishableKey}
              triggerPaymentStatusRefetch={() => setRefetchKey(Date.now())}
            />
          </PaymentStack>
        )
      case PaymentViewStates.Processing:
        return (
          <PaymentStack>
            <GenericMessageBlock
              paymentId={paymentId}
              title={'Stripe is still processing your payment.'}
              subtitle={
                'Hold tight, your payment is still being processed by stripe.'
              }
            />
          </PaymentStack>
        )
      case PaymentViewStates.Succeeded:
        return (
          <>
            <PaymentSuccessSvgr maxW="100%" />
            <StripeReceiptContainer formId={formId} paymentId={paymentId} />
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
  return renderViewState()
}

export default StripeElementWrapper
