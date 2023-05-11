import { rest } from 'msw'
import { PartialDeep } from 'type-fest'

import { GetPaymentInfoDto, PaymentReceiptStatusDto } from '~shared/types'

const BASE_PAYMENT_INFO = {
  client_secret: 'sample_client_secret',
  publishableKey: 'sample_pub_key',
  payment_intent_id: 'sample_piid',
  submissionId: 'sample_responseid',
}

export const getPaymentInfoResponse = ({
  delay = 0,
  overrides,
}: {
  delay?: number | 'infinite'
  overrides?: PartialDeep<GetPaymentInfoDto>
} = {}) => {
  return rest.get<GetPaymentInfoDto>(
    '/api/v3/payments/:paymentId/getinfo',
    (_req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.json({
          ...BASE_PAYMENT_INFO,
          ...overrides,
        }),
      )
    },
  )
}

export const getPaymentReceiptStatusResponse = ({
  delay = 0,
}: {
  delay?: number | 'infinite'
} = {}) => {
  return rest.get<PaymentReceiptStatusDto>(
    '/api/v3/payments/:formId/:paymentId/receipt/status',
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.json({ isReady: true }))
    },
  )
}
