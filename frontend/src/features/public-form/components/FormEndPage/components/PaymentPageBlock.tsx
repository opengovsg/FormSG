import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Flex,
  FormControl,
  Stack,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { FormColorTheme } from '~shared/types/form'

import { centsToDollars } from '~utils/payments'
import Button from '~components/Button'

import FormErrorMessage from '../../../../../components/FormControl/FormErrorMessage'
import { STRIPE_SUBMISSION_ID_KEY } from '../../../constants'
import { usePublicFormContext } from '../../../PublicFormContext'
import { FormPaymentPageProps } from '../FormPaymentPage'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.

export interface PaymentPageBlockProps extends FormPaymentPageProps {
  focusOnMount?: boolean
}

type StripeCheckoutFormProps = Pick<
  PaymentPageBlockProps,
  'submissionId' | 'isRetry'
> & {
  colorTheme: FormColorTheme
}

const StripeCheckoutForm = ({
  colorTheme,
  submissionId,
  isRetry,
}: StripeCheckoutFormProps) => {
  const stripe = useStripe()
  const elements = useElements()

  const [stripeMessage, setStripeMessage] = useState('')
  const [isStripeProcessing, setIsStripeProcessing] = useState(false)

  useEffect(() => {
    if (isRetry) {
      setStripeMessage('Your payment attempt failed.')
    }
  }, [isRetry])

  // Upon complete payment, redirect to <formId>?stripeSubmissionId=<submissionId>
  const return_url = `${
    window.location.href.split('?')[0]
  }?${STRIPE_SUBMISSION_ID_KEY}=${submissionId}`

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault()
    setIsStripeProcessing(true)

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

    if (result.error && result.error.message) {
      // Show error to your customer (for example, payment details incomplete)
      setStripeMessage(result.error.message)
    } else {
      setStripeMessage('')
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
    setIsStripeProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormControl isInvalid={stripeMessage !== ''}>
        <PaymentElement />
        {stripeMessage !== '' ? (
          <FormErrorMessage>
            {`${stripeMessage} No payment has been taken. Please try again.`}
          </FormErrorMessage>
        ) : null}

        <Button
          isFullWidth
          variant="solid"
          colorScheme={`theme-${colorTheme}`}
          type="submit"
          disabled={!stripe || isStripeProcessing}
          isLoading={isStripeProcessing}
          mt="2.5rem"
        >
          Pay now
        </Button>
      </FormControl>
    </form>
  )
}

export const PaymentPageBlock = ({
  submissionId,
  paymentClientSecret,
  publishableKey,
  focusOnMount,
  isRetry,
}: PaymentPageBlockProps): JSX.Element => {
  const { form } = usePublicFormContext()

  const formTitle = form?.title
  const colorTheme = form?.startPage.colorTheme || FormColorTheme.Blue

  const amountCents = form?.payments_field?.amount_cents || 0

  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
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
            S${centsToDollars(amountCents)}
          </Text>
        </Text>

        {paymentClientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              // passing the client secret obtained from the server
              clientSecret: paymentClientSecret,
            }}
          >
            <StripeCheckoutForm
              colorTheme={colorTheme}
              submissionId={submissionId}
              isRetry={isRetry}
            />
          </Elements>
        )}

        <Text textColor="secondary.300">Response ID: {submissionId}</Text>
      </Stack>
    </Flex>
  )
}
