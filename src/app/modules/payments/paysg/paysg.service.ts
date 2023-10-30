import axios from 'axios'

import { createLoggerWithLabel } from '../../../config/logger'

const logger = createLoggerWithLabel(module)

/**
 *   const results = createPayment(
    amount,
    description,
    email,
    referenceId,
    serviceId,
  )
 */
/**
 * 
 * @param param0 
 * @returns data: {
    due_date: null,
    paid_out_timestamp: null,
    payment_sent_timestamp: null,
    payment_succeeded_timestamp: null,
    payment_cancelled_timestamp: null,
    payment_fully_refunded_timestamp: null,
    created_at: '2023-10-17T18:33:52.921+08:00',
    updated_at: '2023-10-17T18:33:52.921+08:00',
    email_delivery_status: 'unsent',
    payment_status: 'unpaid',
    refund_status: 'not_refunded',
    id: 'WlM3qMUUHQ2gipngenEmE',
    creator_id: 'user_02ad8403-5a90-41be-9380-76a131f550c9',
    reference_id: 'submissionid-0001',
    payer_name: 'zeke says it is not important :)',
    payer_identifier: '10charmax',
    payer_email: 'ken@open.gov.sg',
    payer_address: 'zeke says it is not important :)',
    description: 'formsg test first payment',
    amount_in_cents: 1234,
    payment_service_id: 'payment_service_fe5b1b0b-065a-43b8-939d-03ab2b67ede9',
    return_url: null,
    metadata: {},
    stripe_payment_intent_id: 'pi_3O2AayHn4I0OsBks1K3HfXVc',
    payout_id: null,
    latest_status: 'unpaid',
    payment_url: 'https://staging.pay.gov.sg/payments/WlM3qMUUHQ2gipngenEmE'
  }
}
 */

type PaySgCreatePaymentResponseSuccess = {
  data: {
    due_date: string | number
    paid_out_timestamp: string | number
    payment_sent_timestamp: string | number
    payment_succeeded_timestamp: string | number
    payment_cancelled_timestamp: string | number
    payment_fully_refunded_timestamp: string | number
    created_at: string
    updated_at: string
    email_delivery_status: 'unsent'
    payment_status: 'unpaid'
    refund_status: 'not_refunded'
    id: string // 'WlM3qMUUHQ2gipngenEmE'
    creator_id: string // 'user_02ad8403-5a90-41be-9380-76a131f550c9'
    reference_id: string // 'submissionid-0001'
    payer_name: string // 'zeke says it is not important :)'
    payer_identifier: string // '10charmax'
    payer_email: string // 'ken@open.gov.sg'
    payer_address: string // 'zeke says it is not important :)'
    description: string // 'formsg test first payment'
    amount_in_cents: number // 1234
    payment_service_id: string // 'payment_service_fe5b1b0b-065a-43b8-939d-03ab2b67ede9'
    return_url: string // null
    metadata: Record<string, unknown> // {}
    stripe_payment_intent_id: string // 'pi_3O2AayHn4I0OsBks1K3HfXVc'
    payout_id: string // null
    latest_status: 'unpaid'
    payment_url: string // 'https://staging.pay.gov.sg/payments/WlM3qMUUHQ2gipngenEmE'
  }
}

export const createPaymentIntent = ({
  amount,
  description,
  email,
  referenceId,
  serviceId,
  // return_url,
  metadata,
}): Promise<PaySgCreatePaymentResponseSuccess> => {
  const UNIMPORTANT_VALUES = {
    payer_address: 'zeke says it is not important :)',
    payer_name: 'zeke says it is not important :)',
    payer_identifier: '10charmax',
  }
  const logMeta = {
    action: 'createPaymentIntent',
    serviceId,
  }
  logger.info({
    meta: logMeta,
    message: '',
  })
  return axios.post(
    `https://api-staging.pay.gov.sg/v1/payment-services/${serviceId}/payments`,
    {
      amount_in_cents: amount,
      description,
      payer_email: email,
      reference_id: referenceId,
      // return_url,
      metadata,
      ...UNIMPORTANT_VALUES,
    },
    {
      headers: {
        'x-api-key': process.env.PAYSG_API_KEY,
      },
    },
  )
}

export const cancelPaymentIntent = async ({ serviceId }) => {
  const logMeta = {
    action: 'createPaymentIntent',
    serviceId,
  }
  logger.info({
    meta: logMeta,
    message: '',
  })
  // TODO
}
