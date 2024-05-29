import { rest } from 'msw'

import { FormPermissionsDto } from '~shared/types/form/form'

export const getAdminFormCollaborators = ({
  overrides,
  delay = 0,
}: {
  overrides?: FormPermissionsDto
  delay?: number | 'infinite'
} = {}): ReturnType<(typeof rest)['post']> => {
  return rest.get<FormPermissionsDto>(
    '/api/v3/admin/forms/:formId/collaborators',
    (req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200), ctx.json(overrides ?? []))
    },
  )
}

export const updateFormCollaborators = ({
  delay = 0,
  errorCode,
}: {
  delay?: number | 'infinite'
  errorCode: number
}): ReturnType<(typeof rest)['put']> => {
  return rest.put<FormPermissionsDto>(
    '/api/v3/admin/forms/:formId/collaborators',
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(errorCode), ctx.json([]))
    },
  )
}
