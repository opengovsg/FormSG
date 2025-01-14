import { Suspense, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Center,
  Container,
  Flex,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import {
  GetPaymentInfoDto,
  PaymentType,
  ProductItemForReceipt,
} from '~shared/types'

import InlineMessage from '~components/InlineMessage'
import { CopyButton } from '~templates/CopyButton'

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
      <Box
        pt={{ base: '2.5rem', md: '0' }}
        mb={{ base: '1.5rem', md: '0' }}
        w="100%"
      >
        <Container w="100%" maxW="57rem" p={0}>
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
      <Suspense fallback={<Skeleton w={'100%'} h={'350px'} />}>
        <StripePaymentContainer paymentInfoData={paymentInfoData} />
      </Suspense>
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

  const productsProductsType = paymentInfoData.products?.map((product) => {
    return {
      name: product.data.name,
      quantity: product.quantity,
      amount_cents: product.data.amount_cents,
    }
  }) as ProductItemForReceipt[]

  const productsVariableType = [
    {
      name: paymentInfoData.payment_fields_snapshot.name,
      quantity: 1,
      amount_cents: paymentInfoData.amount,
    },
  ] as ProductItemForReceipt[]

  const paymentProducts =
    paymentInfoData.payment_fields_snapshot.payment_type ===
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
                  <Stack>
                    <Text>
                      Make a test payment with the card number below! Payments
                      made on this form will only show in test mode in Stripe.
                    </Text>
                    <Flex align="center">
                      <Text mr="0.25rem">4242 4242 4242 4242</Text>
                      <Flex boxSize="1.5rem" align="center" justify="center">
                        <CopyButton
                          colorScheme="secondary"
                          stringToCopy={`4242424242424242`}
                          aria-label="Copy test card number"
                        />
                      </Flex>
                    </Flex>
                  </Stack>
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
                products={paymentProducts || []}
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
