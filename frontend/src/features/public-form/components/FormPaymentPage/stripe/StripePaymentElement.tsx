import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import {
  GetPaymentInfoDto,
  PaymentType,
  ProductItemForReceipt,
} from '~shared/types'

import InlineMessage from '~components/InlineMessage'

import { useEnv } from '~features/env/queries'

import {
  CreatePaymentIntentFailureBlock,
  PaymentStack,
  PaymentSuccessSvgr,
} from '../components'
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

  const productsProductsType = paymentInfoData?.products?.map((product) => {
    return {
      name: product.data.name,
      quantity: product.quantity,
      amount_cents: product.data.amount_cents,
    }
  }) as ProductItemForReceipt[]

  const productsVariableType = [
    {
      name: paymentInfoData?.payment_fields_snapshot?.name,
      quantity: 1,
      amount_cents: paymentInfoData?.amount,
    },
  ] as ProductItemForReceipt[]

  const paymentProducts =
    paymentInfoData?.payment_fields_snapshot?.payment_type ===
    PaymentType.Variable
      ? productsVariableType
      : productsProductsType

  const viewStates = getPaymentViewStates(
    stripePaymentStatusResponse?.paymentIntent?.status,
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
          <PaymentStack>
            <GenericMessageBlock
              submissionId={paymentInfoData.submissionId}
              title="Payment request was canceled."
              subtitle="The payment request has timed out. No payment has been taken. Please submit the form again."
            />
          </PaymentStack>
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
          <PaymentStack>
            <GenericMessageBlock
              submissionId={paymentInfoData.submissionId}
              title="Stripe is still processing your payment."
              subtitle="Hold tight, your payment is still being processed by stripe."
            />
          </PaymentStack>
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
              products={paymentProducts || []}
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
