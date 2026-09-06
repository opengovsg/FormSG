import { delay as MswDelay, http, HttpResponse } from 'msw'

export const MOCK_GO_LINK_SUFFIX = 'my-mock-form'

/** Handlers for GET /api/v3/admin/forms/:formId/gogov. */
export const goGovHandlers = (
  goLinkSuffix: string | null = MOCK_GO_LINK_SUFFIX,
) => [
  http.get<
    { formId: string },
    never,
    { goLinkSuffix: string } | { message: string }
  >('/api/v3/admin/forms/:formId/gogov', async () => {
    await MswDelay()
    if (goLinkSuffix === null) {
      return HttpResponse.json(
        { message: 'Form does not have a go link' },
        { status: 404 },
      )
    }
    return HttpResponse.json({ goLinkSuffix })
  }),
  http.post<{ formId: string }, never, { goLinkSuffix: string }>(
    '/api/v3/admin/forms/:formId/gogov',
    async () => {
      await MswDelay()
      return HttpResponse.json({
        goLinkSuffix: goLinkSuffix ?? MOCK_GO_LINK_SUFFIX,
      })
    },
  ),
]
