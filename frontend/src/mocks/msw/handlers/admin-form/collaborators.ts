import { delay as MswDelay, http, HttpResponse } from 'msw'

import { FormPermissionsDto } from '~shared/types/form/form'

export const getAdminFormCollaborators = ({
  overrides,
  delay = 0,
}: {
  overrides?: FormPermissionsDto
  delay?: number | 'infinite'
} = {}): ReturnType<(typeof http)['post']> => {
  return http.get<{ formId: string }>(
    '/api/v3/admin/forms/:formId/collaborators',
    async () => {
      await MswDelay(delay)
      return HttpResponse.json(overrides ?? [], {
        status: 200,
      })
    },
  )
}

export const updateFormCollaborators = ({
  delay = 0,
  errorCode,
}: {
  delay?: number | 'infinite'
  errorCode: number
}): ReturnType<(typeof http)['put']> => {
  return http.put<{ formId: string }>(
    '/api/v3/admin/forms/:formId/collaborators',
    async () => {
      await MswDelay(delay)
      return HttpResponse.json([], {
        status: errorCode,
      })
    },
  )
}
