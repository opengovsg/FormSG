import convict, { Schema } from 'convict'

export interface PaymentCron {
  apiSecret: string
}
const cronPaymentFeature: Schema<PaymentCron> = {
  apiSecret: {
    doc: 'Payment cron API secret key to used by cronjobs to call protected routes',
    format: String,
    default: '',
    env: 'CRON_PAYMENT_API_SECRET',
  },
}

export const cronPaymentConfig = convict(cronPaymentFeature)
  .validate({ allowed: 'strict' })
  .getProperties()
