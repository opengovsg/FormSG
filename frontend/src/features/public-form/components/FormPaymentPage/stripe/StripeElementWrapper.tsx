import React, { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Flex, Stack, StackDivider, useToast } from '@chakra-ui/react'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'

import { GetPaymentInfoDto } from '~shared/types'

import { usePublicFormMutations } from '~features/public-form/mutations'

import {
  FeedbackBlock,
  FeedbackFormInput,
} from '../../FormEndPage/components/FeedbackBlock'
import { CreatePaymentIntentFailureBlock } from '../components/CreatePaymentIntentFailureBlock'
import { PaymentSuccessSvgr } from '../components/PaymentSuccessSvgr'
import { useGetPaymentInfo } from '../queries'

import {
  StripePaymentBlock,
  StripePaymentGenericMessageBlock,
} from './components'
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

const PaymentStack = ({ children }: { children: React.ReactNode }) => (
  <Stack
    spacing={{ base: '1.5rem', md: '3rem' }}
    py={{ base: '1.5rem', md: '3rem' }}
    px={{ base: '1.5rem', md: '4rem' }}
    bg="white"
    w="100%"
    divider={<StackDivider />}
  >
    {children}
  </Stack>
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
  const { formId, paymentId } = useParams()
  if (!formId) throw new Error('No formId provided')
  if (!paymentId) throw new Error('No paymentId provided')

  const [refetchKey, setRefetchKey] = useState<number>(0)
  const { data } = useGetPaymentStatusFromStripe({
    clientSecret: paymentInfoData.client_secret,
    stripe,
    refetchKey,
  })

  const { submitFormFeedbackMutation } = usePublicFormMutations(
    formId,
    paymentId,
  )
  const toast = useToast()
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)

  /**
   * Handles feedback submission
   */
  const handleSubmitFeedback = useCallback(
    (inputs: FeedbackFormInput) => {
      // no mutation required in preview-form mode
      return submitFormFeedbackMutation.mutateAsync(inputs, {
        onSuccess: () => {
          toast({
            description: 'Thank you for submitting your feedback!',
            status: 'success',
            isClosable: true,
          })
          setIsFeedbackSubmitted(true)
        },
      })
    },
    [submitFormFeedbackMutation, toast],
  )

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
            <StripePaymentGenericMessageBlock
              paymentId={paymentId}
              title={'The payment request has been canceled.'}
              subtitle={'No payment has been made.'}
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
          <>
            <PaymentSuccessSvgr maxW="100%" />
            <PaymentStack>
              <StripePaymentGenericMessageBlock
                paymentId={paymentId}
                title={'Stripe is processing your payment.'}
                subtitle={''}
              />
            </PaymentStack>
          </>
        )
      case PaymentViewStates.Succeeded:
        return (
          <>
            <PaymentSuccessSvgr maxW="100%" />
            <PaymentStack>
              <StripeReceiptContainer formId={formId} paymentId={paymentId} />
              {!isFeedbackSubmitted && (
                <FeedbackBlock onSubmit={handleSubmitFeedback} />
              )}
            </PaymentStack>
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
  return <>{renderViewState()}</>
}

export default StripeElementWrapper
