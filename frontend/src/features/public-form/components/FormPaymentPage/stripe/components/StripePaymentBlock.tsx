import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  Stack,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

import { GetPaymentInfoDto } from '~shared/types'
import { FormColorTheme, FormResponseMode } from '~shared/types/form'

import { useBrowserStm } from '~hooks/payments'
import Button from '~components/Button'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { PaymentSummary } from '../../components'

interface PaymentPageBlockProps {
  paymentInfoData: GetPaymentInfoDto
  isRetry?: boolean
  focusOnMount?: boolean
  triggerPaymentStatusRefetch: () => void
  paymentAmount: number
  // null here due to payment_intent.description from stripe
  paymentItemName?: string | null
}

interface StripeCheckoutFormProps {
  isRetry?: boolean
  colorTheme: FormColorTheme
  triggerPaymentStatusRefetch: () => void
}

const StripeCheckoutForm = ({
  colorTheme,
  isRetry,
  triggerPaymentStatusRefetch,
}: StripeCheckoutFormProps) => {
  const { formId } = usePublicFormContext()
  const stripe = useStripe()
  const elements = useElements()

  const [stripeMessage, setStripeMessage] = useState('')
  const [isStripeProcessing, setIsStripeProcessing] = useState(false)
  const [, , clearPaymentMemory] = useBrowserStm(formId)
  const [isPaynow, setIsPayNow] = useState(false)

  useEffect(() => {
    if (isRetry) {
      setStripeMessage('Your payment attempt failed.')
    }
  }, [isRetry])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault()
    setIsStripeProcessing(true)
    setStripeMessage('')

    if (!stripe || !elements) {
      return null
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
    }

    const result = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        // 1. Responders should return back to the same payment page to view the receipt
        // 2. Your customer will be redirected to your `return_url`. For some payment
        //    methods like iDEAL, your customer will be redirected to an intermediate
        //    site first to authorize the payment, then redirected to the `return_url`.
        return_url: window.location.href,
      },

      // The default is `redirect?: 'always'` and this will introduce
      // a bad UX of triggering a page reload of the same page.
      // By setting if_required we can control when it reloads,
      // which is after the payment had completed successfully.
      redirect: 'if_required',
    })

    if (result.error && result.error.message) {
      setStripeMessage(result.error.message)
    } else {
      // In the event that customer is not on a payment that has a redirected flow,
      // we will trigger a payment status refetch
      triggerPaymentStatusRefetch()
      clearPaymentMemory()
    }
    setIsStripeProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormControl isInvalid={stripeMessage !== ''}>
        <PaymentElement
          onChange={(e) => {
            if (e.value.type === 'paynow') {
              setIsPayNow(true)
            } else {
              setIsPayNow(false)
            }
          }}
        />
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
          isDisabled={!stripe || isStripeProcessing}
          isLoading={isStripeProcessing}
          mt="2.5rem"
        >
          {isPaynow ? 'Scan PayNow QR code' : 'Submit payment'}
        </Button>
      </FormControl>
    </form>
  )
}

export const StripePaymentBlock = ({
  paymentInfoData,
  focusOnMount,
  isRetry,
  triggerPaymentStatusRefetch,
  paymentAmount,
  paymentItemName,
}: PaymentPageBlockProps): JSX.Element => {
  const { form } = usePublicFormContext()

  const formTitle = form?.title
  const colorTheme = form?.startPage.colorTheme || FormColorTheme.Blue

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

  if (!form || form.responseMode !== FormResponseMode.Encrypt) {
    return <></>
  }

  return (
    <Flex flexDir="column">
      <Stack tabIndex={-1} ref={focusRef} spacing="1rem">
        <Box>
          <VisuallyHidden aria-live="assertive">
            {submittedAriaText}
          </VisuallyHidden>
          <Text textStyle="h3" textColor="primary.500" mb="2.25rem">
            Payment
          </Text>
          <PaymentSummary
            form={form}
            paymentInfoData={paymentInfoData}
            colorTheme={colorTheme}
            paymentAmount={paymentAmount}
            paymentItemName={paymentItemName}
          />
        </Box>
        <StripeCheckoutForm
          colorTheme={colorTheme}
          isRetry={isRetry}
          triggerPaymentStatusRefetch={triggerPaymentStatusRefetch}
        />
        <Text textColor="secondary.300">
          Response ID: {paymentInfoData.submissionId}
        </Text>
      </Stack>
    </Flex>
  )
}
