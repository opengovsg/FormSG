import { rest } from 'msw'

import {
  AdminDashboardFormMetaDto,
  AdminFormViewDto,
  FormResponseMode,
  FormStatus,
} from '~shared/types'

import { MOCK_USER } from '../user'

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
  overrides?: { status?: number; body?: AdminFormViewDto }
  delay?: number | 'infinite'
} = {}): ReturnType<typeof rest['get']> => {
  return rest.post<AdminFormViewDto>(
    '/api/v3/admin/forms/:formId/collaborators/transfer-owner',
    (req, res, ctx) => {
      const formId = req.params.formId
      return res(
        ctx.delay(delay),
        ctx.status(overrides?.status ?? 200),
        ctx.json(
          overrides?.body ??
            ({
              form: {
                _id: formId,
                status: FormStatus.Public,
                responseMode: FormResponseMode.Encrypt,
                title: `Test form ${formId}`,
                admin: {
                  ...MOCK_USER,
                },
                lastModified: `2023-06-06T07:00:00.000Z`,
              },
            } as AdminFormViewDto),
        ),
      )
    },
  )
}
