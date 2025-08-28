import { delay as MswDelay, http, HttpResponse } from 'msw'
import { PartialDeep } from 'type-fest'

import {
  GetPaymentInfoDto,
  PaymentReceiptStatusDto,
  PaymentType,
} from '~shared/types'

const BASE_PAYMENT_INFO = {
  client_secret: 'sample_client_secret',
  publishableKey: 'sample_pub_key',
  payment_intent_id: 'sample_piid',
  submissionId: 'sample_responseid',
  products: [],
  amount: 1000,
  payment_fields_snapshot: {
    amount_cents: 0,
    description: '',
    enabled: false,
    global_min_amount_override: 0,
    gst_enabled: true,
    max_amount: 0,
    min_amount: 0,
    name: '',
    payment_type: PaymentType.Products,
    products: [],
    products_meta: { multi_product: false },
  },
}

export const getPaymentInfoResponse = ({
  delay = 0,
  overrides,
}: {
  delay?: number | 'infinite'
  overrides?: PartialDeep<GetPaymentInfoDto>
} = {}) => {
  return http.get<{ paymentId: string }, never, PartialDeep<GetPaymentInfoDto>>(
    '/api/v3/payments/:paymentId/getinfo',
    async () => {
      await MswDelay(delay)
      return HttpResponse.json({
        ...BASE_PAYMENT_INFO,
        ...overrides,
      })
    },
  )
}

export const getPaymentReceiptStatusResponse = ({
  delay = 0,
}: {
  delay?: number | 'infinite'
} = {}) => {
  return http.get<
    { formId: string; paymentId: string },
    never,
    PaymentReceiptStatusDto
  >('/api/v3/payments/:formId/:paymentId/receipt/status', async () => {
    await MswDelay(delay)
    return HttpResponse.json({ isReady: true, paymentDate: null })
  })
}
