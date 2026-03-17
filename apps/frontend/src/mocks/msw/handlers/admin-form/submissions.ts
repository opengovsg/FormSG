import { delay as MswDelay, http, HttpResponse } from 'msw'

export const getAdminFormSubmissions = ({
  delay = 0,
  override,
}: {
  delay?: number | 'infinite'
  override?: number
} = {}) => {
  return http.get<{ formId: string }, never, number>(
    '/api/v3/admin/forms/:formId/submissions/count',
    async () => {
      await MswDelay(delay)
      return HttpResponse.json(override ?? 20, { status: 200 })
    },
  )
}
