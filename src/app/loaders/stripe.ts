import Stripe from 'stripe'

import { paymentConfig } from '../config/features/payment.config'

// StripeConfig required here, see https://github.com/stripe/stripe-node#usage-with-typescript
export const stripe = new Stripe(paymentConfig.stripeSecretKey, {
  apiVersion: '2022-11-15',
})
