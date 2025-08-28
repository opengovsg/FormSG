import { delay as MswDelay, http, HttpResponse } from 'msw'

import { AdminFormViewDto, FormResponseMode, FormStatus } from '~shared/types'

import { MOCK_USER } from '../user'

export const transferAllFormsOwnership = ({
  overrides,
  delay = 0,
}: {
  overrides?: { status?: number; body?: { email: string } }
  delay?: number | 'infinite'
} = {}): ReturnType<(typeof http)['get']> => {
  return http.post<never, { email: string }, { email: string }>(
    '/api/v3/admin/forms/all-transfer-owner',
    async ({ request }) => {
      const body = await request.json()
      const email = body.email

      await MswDelay(delay)
      return HttpResponse.json(overrides?.body ?? { email }, {
        status: 200,
      })
    },
  )
}

export const transferOwnership = ({
  overrides,
  delay = 0,
}: {
  overrides?: { status?: number; body?: AdminFormViewDto }
  delay?: number | 'infinite'
} = {}): ReturnType<(typeof http)['get']> => {
  return http.post<{ formId: string }, never, AdminFormViewDto>(
    '/api/v3/admin/forms/:formId/collaborators/transfer-owner',
    async ({ params }) => {
      const formId = params.formId
      await MswDelay(delay)
      return HttpResponse.json(
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
        {
          status: overrides?.status ?? 200,
        },
      )
    },
  )
}
