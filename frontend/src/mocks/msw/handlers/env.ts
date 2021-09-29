import { rest } from 'msw'

import { ClientEnvVars } from '~shared/types/core'

export const envHandlers = [
  // TODO: Add more mock client env vars as needed
  rest.get<never, Partial<ClientEnvVars>>(
    '/api/v3/client/env',
    (_req, res, ctx) => {
      return res(
        ctx.delay(),
        ctx.json({
          logoBucketUrl: 'local-logo-bucket',
        }),
      )
    },
  ),
]
