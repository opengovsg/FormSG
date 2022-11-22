import { useEffect, useMemo, useRef } from 'react'
import { Box, Flex, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { FormColorTheme } from '~shared/types/form'

import Button from '~components/Button'

import { useEnv } from '~features/env/queries'

import { FormPaymentPageProps } from '../FormPaymentPage'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.

export interface PaymentPageBlockProps extends FormPaymentPageProps {
  focusOnMount?: boolean
}

type StripeCheckoutFormProps = {
  colorTheme: FormColorTheme
  submissionId: string
}

const StripeCheckoutForm = ({
  colorTheme,
  submissionId,
}: StripeCheckoutFormProps) => {
  const stripe = useStripe()
  const elements = useElements()

  // Upon complete payment, redirect to <formId>?paymentSubmissionId=<submissionId>
  const return_url =
    window.location.href + '?paymentSubmissionId=' + submissionId

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault()

    if (!stripe || !elements) {
      return null
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
    }

    const result = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url,
      },
    })

    if (result.error) {
      // Show error to your customer (for example, payment details incomplete)
      console.log(result.error.message)
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        isFullWidth
        variant="solid"
        colorScheme={`theme-${colorTheme}`}
        type="submit"
        disabled={!stripe}
        mt="2.5rem"
      >
        Pay now
      </Button>
    </form>
  )
}

export const PaymentPageBlock = ({
  formTitle,
  submissionData,
  colorTheme = FormColorTheme.Blue,
  focusOnMount,
  formPayments,
  paymentClientSecret,
}: PaymentPageBlockProps): JSX.Element => {
  const amountCents = formPayments?.amount_cents || 0

  const stripePublishableKey = useEnv().data?.stripePublishableKey || ''

  const stripePromise = useMemo(
    () => loadStripe(stripePublishableKey),
    [stripePublishableKey],
  )

  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) {
      focusRef.current?.focus()
    }
  }, [focusOnMount])

  const submittedAriaText = useMemo(() => {
    if (formTitle) {
      return `Please make payment for ${formTitle}.`
    }
    return 'Please make payment.'
  }, [formTitle])

  return (
    <Flex flexDir="column">
      <Stack tabIndex={-1} ref={focusRef} spacing="1rem">
        <Box>
          <VisuallyHidden aria-live="assertive">
            {submittedAriaText}
          </VisuallyHidden>
          <Text textStyle="h3" textColor="primary.500">
            Payment
          </Text>
          <Text textStyle="body-2" textColor="secondary.500">
            This amount is inclusive of GST
          </Text>
        </Box>
        <Text textStyle="body-1" textColor="secondary.700">
          Your credit card will be charged:{' '}
          <Text as="span" fontWeight="bold">
            S${(amountCents / 100).toFixed(2)}
          </Text>
        </Text>

        {paymentClientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              // passing the client secret obtained from the server
              clientSecret: paymentClientSecret,
            }}
          >
            <StripeCheckoutForm
              colorTheme={colorTheme}
              submissionId={submissionData.id || ''}
            />
          </Elements>
        ) : (
          <>TODO: Mock for preview / skeleton state?</>
        )}

        <Text textColor="secondary.300">Response ID: {submissionData.id}</Text>
      </Stack>
    </Flex>
  )
}
