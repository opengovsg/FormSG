import { rest } from 'msw'

import { SmsCountsDto } from '~shared/types/form'

export const putTwilioCredentials = ({
  delay = 0,
}: {
  delay?: number | 'infinite' | 'real'
} = {}) => {
  return rest.put('/api/v3/admin/forms/:formId/twilio', (req, res, ctx) => {
    return res(
      ctx.delay(delay),
      ctx.status(200),
      ctx.json({ message: 'Success' }),
    )
  })
}

export const getFreeSmsQuota = ({
  delay = 0,
  override,
}: {
  delay?: number | 'infinite' | 'real'
  override?: Partial<SmsCountsDto>
} = {}) => {
  return rest.get(
    '/api/v3/admin/forms/:formId/verified-sms/count/free',
    (_req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json<SmsCountsDto>({
          freeSmsCounts: 45,
          quota: 10000,
          ...override,
        }),
      )
    },
  )
}
