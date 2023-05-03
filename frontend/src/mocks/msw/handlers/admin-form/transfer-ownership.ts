import { rest } from 'msw'

import { AdminDashboardFormMetaDto } from '~shared/types'

export const getOwnedForms = ({
  overrides,
  delay = 0,
}: {
  overrides?: AdminDashboardFormMetaDto[]
  delay?: number | 'infinite'
} = {}): ReturnType<typeof rest['get']> => {
  return rest.get<AdminDashboardFormMetaDto[]>(
    '/api/v3/admin/forms/owned',
    (req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200), ctx.json(overrides ?? []))
    },
  )
}

export const transferOwnership = ({
  overrides,
  delay = 0,
}: {
  overrides?: { status?: number; body?: string[] }
  delay?: number | 'infinite'
} = {}): ReturnType<typeof rest['get']> => {
  return rest.post<AdminDashboardFormMetaDto[]>(
    '/api/v3/admin/forms/:formId/collaborators/transfer-owner',
    (req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.status(overrides?.status ?? 200),
        ctx.json(overrides?.body ?? []),
      )
    },
  )
}
