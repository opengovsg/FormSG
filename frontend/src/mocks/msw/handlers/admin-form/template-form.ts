import { mergeWith } from 'lodash'
import { delay as MswDelay, http, HttpResponse } from 'msw'
import { PartialDeep } from 'type-fest'

import { FormId, PreviewFormViewDto } from '~shared/types/form/form'

import { ADMINFORM_USETEMPLATE_ROUTE } from '~constants/routes'

import { BASE_FORM } from '../public-form'

export const getTemplateFormResponse = ({
  delay = 0,
  overrides,
}: {
  delay?: number | 'infinite'
  overrides?: PartialDeep<PreviewFormViewDto>
} = {}) => {
  return http.get<{ formId: string }, never, PreviewFormViewDto>(
    `/api/v3/admin/forms/:formId/${ADMINFORM_USETEMPLATE_ROUTE}`,
    async ({ params }) => {
      const formId = params.formId ?? '61540ece3d4a6e50ac0cc6ff'

      const response = mergeWith(
        {},
        {
          form: {
            _id: formId as FormId,
            ...BASE_FORM,
          },
        },
        overrides,
        (objValue, srcValue) => {
          if (Array.isArray(objValue)) {
            return [...srcValue, ...objValue]
          }
        },
      ) as PreviewFormViewDto
      await MswDelay(delay)
      return HttpResponse.json(response)
    },
  )
}

export const getTemplateFormErrorResponse = ({
  delay = 0,
  status = 403,
  message = 'If you require further assistance, please contact the agency that gave you the form link.',
}: {
  delay?: number | 'infinite'
  status?: number
  message?: string
} = {}) => {
  return http.get<{ formId: string }>(
    `/api/v3/admin/forms/:formId/${ADMINFORM_USETEMPLATE_ROUTE}`,
    async () => {
      await MswDelay(delay)
      return HttpResponse.json({ message }, { status })
    },
  )
}

export const publicFormHandlers = [getTemplateFormResponse()]
