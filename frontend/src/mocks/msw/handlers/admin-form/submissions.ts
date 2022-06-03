import { rest } from 'msw'

export const getAdminFormSubmissions = ({
  delay = 0,
  override,
}: {
  delay?: number | 'infinite'
  override?: number
} = {}) => {
  return rest.get(
    '/api/v3/admin/forms/:formId/submissions/count',
    (req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200), ctx.json(override ?? 20))
    },
  )
}
