import convict, { Schema } from 'convict'

export interface IStripe {
  defaultCurrency: string
  stripePublishableKey: string
  stripeSecretKey: string
  stripeClientID: string
  stripeWebhookApiKey: string
  stripeWebhookSecretKey: string
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
  stripeWebhookApiKey: {
    doc: 'Stripe webhook API key',
    format: String,
    default: '',
    env: 'PAYMENT_STRIPE_WEBHOOK_API_KEY',
  },
  stripeWebhookSecretKey: {
    doc: 'Stripe webhook secret key',
    format: String,
    default:
      'whsec_ab7313f9397f4f1fcef14c9432b7ba100305e1a20f4b79a5f9978854820307dd',
    env: 'PAYMENT_STRIPE_WEBHOOK_SECRET_KEY',
  },
}

export const paymentConfig = convict(paymentFeature)
  .validate({ allowed: 'strict' })
  .getProperties()
