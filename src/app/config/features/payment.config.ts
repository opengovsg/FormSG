import convict, { Schema } from 'convict'

export interface IStripe {
  stripeSecretKey: string
  stripeClientID: string
}

const paymentFeature: Schema<IStripe> = {
  stripeSecretKey: {
    doc: 'Stripe Account Secret Key',
    format: 'string',
    default: null,
    env: 'PAYMENT_STRIPE_SECRET_KEY',
  },
  stripeClientID: {
    doc: 'Stripe Client ID',
    format: 'string',
    default: null,
    env: 'PAYMENT_STRIPE_CLIENT_ID',
  },
}

export const paymentConfig = convict(paymentFeature)
  .validate({ allowed: 'strict' })
  .getProperties()
