import { rest } from 'msw'

import { AdminFormViewDto, FormResponseMode, FormStatus } from '~shared/types'

import { MOCK_USER } from '../user'

export const transferAllFormsOwnership = ({
  overrides,
  delay = 0,
}: {
  overrides?: { status?: number; body?: { email: string } }
  delay?: number | 'infinite'
} = {}): ReturnType<(typeof rest)['get']> => {
  return rest.post<{ email: string }>(
    '/api/v3/admin/forms/all-transfer-owner',
    (req, res, ctx) => {
      const email = req.body.email
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json(overrides?.body ?? { email: email }),
      )
    },
  )
}

export const transferOwnership = ({
  overrides,
  delay = 0,
}: {
  overrides?: { status?: number; body?: AdminFormViewDto }
  delay?: number | 'infinite'
} = {}): ReturnType<(typeof rest)['get']> => {
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
