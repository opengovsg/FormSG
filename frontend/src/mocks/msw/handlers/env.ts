import { rest } from 'msw'

import { ClientEnvVars } from '~shared/types/core'

export const MOCK_ENVS: Partial<ClientEnvVars> = {
  logoBucketUrl: 'local-logo-bucket',
  // Official reCaptcha test keys, see https://developers.google.com/recaptcha/docs/faq.
  captchaPublicKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
}

export const envHandlers = [
  // TODO: Add more mock client env vars as needed
  rest.get<never, never, Partial<ClientEnvVars>>(
    '/api/v3/client/env',
    (_req, res, ctx) => {
      return res(ctx.delay(), ctx.json(MOCK_ENVS))
    },
  ),
]
