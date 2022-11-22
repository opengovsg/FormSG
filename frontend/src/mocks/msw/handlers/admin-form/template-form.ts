import { mergeWith } from 'lodash'
import { rest } from 'msw'
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
  return rest.get<PreviewFormViewDto>(
    `/api/v3/admin/forms/:formId/${ADMINFORM_USETEMPLATE_ROUTE}`,
    (req, res, ctx) => {
      const formId = req.params.formId ?? '61540ece3d4a6e50ac0cc6ff'

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
      return res(ctx.delay(delay), ctx.json(response))
    },
  )
}

export const getTemplateFormErrorResponse = ({
  delay = 0,
  status = 403,
  message = 'If you think this is a mistake, please contact the agency that gave you the form link.',
}: {
  delay?: number | 'infinite'
  status?: number
  message?: string
} = {}) => {
  return rest.get<PreviewFormViewDto>(
    `/api/v3/admin/forms/:formId/${ADMINFORM_USETEMPLATE_ROUTE}`,
    (req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(status), ctx.json({ message }))
    },
  )
}

export const publicFormHandlers = [getTemplateFormResponse()]
