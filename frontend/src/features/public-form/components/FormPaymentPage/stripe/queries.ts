import { useQuery } from 'react-query'
import { PaymentIntentResult, Stripe } from '@stripe/stripe-js'

import { ApiError } from '~typings/core'

export const useGetPaymentStatusFromStripe = ({
  clientSecret,
  stripe,
  refetchKey, // a nonce which triggers refetch if changed
}: {
  clientSecret: string
  stripe: Stripe
  refetchKey: number
}) => {
  return useQuery<PaymentIntentResult, ApiError>(
    [clientSecret, refetchKey],
    () => stripe.retrievePaymentIntent(clientSecret),
    { suspense: true },
  )
}
