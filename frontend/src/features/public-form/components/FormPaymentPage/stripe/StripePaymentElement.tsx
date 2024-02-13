import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Flex, Link, Stack, Text } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import InlineMessage from '~components/InlineMessage'

import { useEnv } from '~features/env/queries'

import {
  CreatePaymentIntentFailureBlock,
  PaymentStack,
  PaymentSuccessSvgr,
} from '../components'
import { LoadingSvgr } from '../components/assets/LoadingSvgr'
import { PaymentCanceledSvgr } from '../components/assets/PaymentCanceledSvgr'
import { useGetPaymentInfo } from '../queries'

import { GenericMessageBlock, StripePaymentBlock } from './components'
import { useGetPaymentStatusFromStripe } from './queries'
import { StripeReceiptContainer } from './StripeReceiptContainer'
import { getPaymentViewStates, PaymentViewStates } from './utils'

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

  const shareLink = useMemo(
    () => `${window.location.origin}/${formId}`,
    [formId],
  )

  const renderViewState = () => {
    switch (viewStates) {
      case PaymentViewStates.Invalid:
        return (
          <PaymentStack>
            <CreatePaymentIntentFailureBlock
              submissionId={paymentInfoData.submissionId}
            />
          </PaymentStack>
        )
      case PaymentViewStates.Canceled:
        return (
          <>
            <PaymentCanceledSvgr maxW="100%" />
            <PaymentStack noBg>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Stack spacing="1rem">
                  <Text textStyle="h2" textColor="secondary.500">
                    Your payment session has expired
                  </Text>
                  <Text textStyle="subhead-1" textColor="secondary.500">
                    No payment has been taken. Please fill in this form again.
                  </Text>
                  <Box
                    pt="1.5rem"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Link href={`${shareLink}`}>
                      <Button variant="outline" width="8.7rem">
                        Fill form again
                      </Button>
                    </Link>
                  </Box>
                </Stack>
              </Box>
            </PaymentStack>
          </>
        )
      case PaymentViewStates.PendingPayment: {
        // The item name is passed over to Stripe as PaymentIntent.description
        const itemName = stripePaymentStatusResponse?.paymentIntent?.description
        return (
          <>
            {secretEnv === 'production' ? null : (
              <InlineMessage variant="warning" mb="1rem">
                Use '4242 4242 4242 4242' as your card number to test payments
                on this form. Payments made on this form will only show in test
                mode in Stripe.
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
          </>
        )
      }
      case PaymentViewStates.Processing:
        return (
          <>
            <LoadingSvgr maxW="100%" />
            <PaymentStack mt="2rem">
              <GenericMessageBlock
                submissionId={paymentInfoData.submissionId}
                title="We are still processing your payment."
                subtitle="Hold tight, this should not take long."
              />
            </PaymentStack>
          </>
        )
      case PaymentViewStates.Succeeded:
        return (
          <>
            <PaymentSuccessSvgr maxW="100%" />
            <StripeReceiptContainer
              formId={formId}
              paymentId={paymentId}
              submissionId={paymentInfoData.submissionId}
              amount={paymentInfoData.amount}
              products={paymentInfoData.products || []}
              paymentFieldsSnapshot={paymentInfoData.payment_fields_snapshot}
            />
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
