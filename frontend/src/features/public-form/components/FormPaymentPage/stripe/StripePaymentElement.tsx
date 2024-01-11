import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Center, Container, Flex } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import InlineMessage from '~components/InlineMessage'

import { useEnv } from '~features/env/queries'

import { PublicFormWrapper } from '../../PublicFormWrapper'
import {
  CreatePaymentIntentFailureBlock,
  PaymentStack,
  PaymentSuccessSvgr,
} from '../components'
import { PaymentHeader } from '../components/PaymentHeader'
import { useGetPaymentInfo } from '../queries'

import { GenericMessageBlock, StripePaymentBlock } from './components'
import { useGetPaymentStatusFromStripe } from './queries'
import { StripeReceiptContainer } from './StripeReceiptContainer'
import { getPaymentViewStates, PaymentViewStates } from './utils'

const PaymentFormWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <PublicFormWrapper>
      <Box py="1rem" w="100%">
        <Container w="57rem" maxW="100%" p={0}>
          {children}
        </Container>
      </Box>
    </PublicFormWrapper>
  )
}

const StripePaymentElement = ({ paymentId }: { paymentId: string }) => {
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
      <StripePaymentContainer paymentInfoData={paymentInfoData} />
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

  const { data: { secretEnv } = {} } = useEnv()

  const stripe = useStripe()
  if (!stripe) throw Promise.reject('Stripe is not ready')

  const [refetchKey, setRefetchKey] = useState<number>(0)
  const { data: stripePaymentStatusResponse } = useGetPaymentStatusFromStripe({
    clientSecret: paymentInfoData.client_secret,
    stripe,
    refetchKey,
  })

  const viewStates = getPaymentViewStates(
    stripePaymentStatusResponse?.paymentIntent?.status,
  )

  const renderViewState = () => {
    switch (viewStates) {
      case PaymentViewStates.Invalid:
        return (
          <>
            <PaymentHeader />
            <PaymentFormWrapper>
              <PaymentStack>
                <CreatePaymentIntentFailureBlock
                  submissionId={paymentInfoData.submissionId}
                />
              </PaymentStack>
            </PaymentFormWrapper>
          </>
        )
      case PaymentViewStates.Canceled:
        return (
          <>
            <PaymentHeader />
            <PaymentFormWrapper>
              <PaymentStack>
                <GenericMessageBlock
                  submissionId={paymentInfoData.submissionId}
                  title="Payment request was canceled."
                  subtitle="The payment request has timed out. No payment has been taken. Please submit the form again."
                />
              </PaymentStack>
            </PaymentFormWrapper>
          </>
        )
      case PaymentViewStates.PendingPayment: {
        // The item name is passed over to Stripe as PaymentIntent.description
        const itemName = stripePaymentStatusResponse?.paymentIntent?.description
        return (
          <>
            <PaymentHeader />
            <PaymentFormWrapper>
              {secretEnv === 'production' ? null : (
                <InlineMessage variant="warning" mb="1rem">
                  Use '4242 4242 4242 4242' as your card number to test payments
                  on this form. Payments made on this form will only show in
                  test mode in Stripe.
                </InlineMessage>
              )}
              <PaymentStack>
                <StripePaymentBlock
                  paymentInfoData={paymentInfoData}
                  triggerPaymentStatusRefetch={() => setRefetchKey(Date.now())}
                  paymentAmount={
                    stripePaymentStatusResponse?.paymentIntent?.amount ?? 0
                  }
                  paymentItemName={itemName}
                />
              </PaymentStack>
            </PaymentFormWrapper>
          </>
        )
      }
      case PaymentViewStates.Processing:
        return (
          <>
            <PaymentHeader />
            <PaymentFormWrapper>
              <PaymentStack>
                <GenericMessageBlock
                  submissionId={paymentInfoData.submissionId}
                  title="Stripe is still processing your payment."
                  subtitle="Hold tight, your payment is still being processed by stripe."
                />
              </PaymentStack>
            </PaymentFormWrapper>
          </>
        )
      case PaymentViewStates.Succeeded:
        return (
          <>
            <PaymentFormWrapper>
              <Center>
                <PaymentSuccessSvgr maxW="100%" />
              </Center>
              <StripeReceiptContainer
                formId={formId}
                paymentId={paymentId}
                submissionId={paymentInfoData.submissionId}
                amount={paymentInfoData.amount}
                products={paymentInfoData.products || []}
                paymentFieldsSnapshot={paymentInfoData.payment_fields_snapshot}
              />
            </PaymentFormWrapper>
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

export default StripePaymentElement
