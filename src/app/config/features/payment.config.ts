import convict, { Schema } from 'convict'

export interface IStripe {
  defaultCurrency: string
  stripePublishableKey: string
  stripeSecretKey: string
  stripeClientID: string
  stripeWebhookSecret: string
  maxPaymentAmountCents: number
  minPaymentAmountCents: number
  guideLink: string
}

const paymentFeature: Schema<IStripe> = {
  defaultCurrency: {
    doc: 'Default currency for all payments',
    format: String,
    default: 'sgd',
    env: 'PAYMENT_DEFAULT_CURRENCY',
  },
  stripePublishableKey: {
    doc: 'Stripe Account Publishable Key',
    format: String,
    default: '',
    env: 'PAYMENT_STRIPE_PUBLISHABLE_KEY',
  },
  stripeSecretKey: {
    doc: 'Stripe account Secret Key',
    format: String,
    default: '',
    env: 'PAYMENT_STRIPE_SECRET_KEY',
  },
  stripeClientID: {
    doc: 'Stripe client ID',
    format: String,
    default: '',
    env: 'PAYMENT_STRIPE_CLIENT_ID',
  },
  stripeWebhookSecret: {
    doc: 'Stripe webhook secret',
    format: String,
    default: '',
    env: 'PAYMENT_STRIPE_WEBHOOK_SECRET',
  },
  maxPaymentAmountCents: {
    doc: 'Maximum amount that can be paid for a form',
    format: Number,
    default: 100000, // $1000, due to IRAS limit for invoice
    env: 'PAYMENT_MAX_PAYMENT_AMOUNT_CENTS',
  },
  minPaymentAmountCents: {
    doc: 'Minimum that can be paid for a form',
    format: Number,
    default: 50, // $0.50, as specified by stripe
    env: 'PAYMENT_MIN_PAYMENT_AMOUNT_CENTS',
  },
  guideLink: {
    doc: 'Link to payment guide',
    format: String,
    default: 'https://go.gov.sg/formsg-guide-payments',
    env: 'PAYMENT_GUIDE_LINK',
  },
}

export const paymentConfig = convict(paymentFeature)
  .validate({ allowed: 'strict' })
  .getProperties()
