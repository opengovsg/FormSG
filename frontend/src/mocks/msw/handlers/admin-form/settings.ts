import { pick } from 'lodash'
import { delay as MswDelay, http, HttpResponse } from 'msw'

import {
  EMAIL_FORM_SETTINGS_FIELDS,
  MULTIRESPONDENT_FORM_SETTINGS_FIELDS,
  STORAGE_FORM_SETTINGS_FIELDS,
} from '~shared/constants/form'
import {
  AdminFormDto,
  AdminFormViewDto,
  FormId,
  FormResponseMode,
  FormSettings,
} from '~shared/types/form/form'

import { createMockForm } from './form'

export const getAdminFormView = ({
  delay = 0,
  overrides,
  mode = FormResponseMode.Email,
}: {
  delay?: number | 'infinite'
  overrides?: Partial<AdminFormDto>
  mode?: FormResponseMode
} = {}) => {
  return http.get<{ formId: string }, never, AdminFormViewDto>(
    '/api/v3/admin/forms/:formId',
    async ({ params }) => {
      await MswDelay(delay)
      return HttpResponse.json(
        createMockForm({
          _id: params.formId as FormId,
          responseMode: mode,
          ...overrides,
        }),
        { status: 200 },
      )
    },
  )
}

export const getAdminFormSettings = ({
  delay = 0,
  overrides,
  mode = FormResponseMode.Email,
}: {
  delay?: number | 'infinite'
  overrides?: Partial<FormSettings>
  mode?: FormResponseMode
} = {}) => {
  const MODE_TO_SETTINGS_FIELDS_MAP = {
    [FormResponseMode.Email]: EMAIL_FORM_SETTINGS_FIELDS,
    [FormResponseMode.Encrypt]: STORAGE_FORM_SETTINGS_FIELDS,
    [FormResponseMode.Multirespondent]: MULTIRESPONDENT_FORM_SETTINGS_FIELDS,
  }

  return http.get<{ formId: string }, never>(
    '/api/v3/admin/forms/:formId/settings',
    async ({ params }) => {
      await MswDelay(delay)
      return HttpResponse.json(
        pick(
          createMockForm({
            _id: params.formId as FormId,
            responseMode: mode,
            ...overrides,
          }).form,
          MODE_TO_SETTINGS_FIELDS_MAP[mode],
        ),
        { status: 200 },
      )
    },
  )
}

export const patchAdminFormSettings = ({
  delay = 0,
  overrides,
  mode = FormResponseMode.Email,
}: {
  delay?: number | 'infinite'
  overrides?: Partial<FormSettings>
  mode?: FormResponseMode
} = {}) => {
  return http.patch<{ formId: string }, Partial<FormSettings>>(
    '/api/v3/admin/forms/:formId/settings',
    async ({ params, request }) => {
      const body = await request.json()
      await MswDelay(delay)
      return HttpResponse.json(
        pick(
          createMockForm({
            _id: params.formId as FormId,
            responseMode: mode,
            ...overrides,
            ...body,
          }).form,
          mode === FormResponseMode.Email
            ? EMAIL_FORM_SETTINGS_FIELDS
            : STORAGE_FORM_SETTINGS_FIELDS,
        ),
        { status: 200 },
      )
    },
  )
}

export const putFormWhitelistSettingSimulateCsvStringValidationError = (
  formId: string,
) => {
  return http.put<{ formId: string }, never>(
    `/api/v3/admin/forms/${formId}/settings/whitelist`,
    async () => {
      return HttpResponse.json(
        { message: 'Storybook whitelist update mock validation error' },
        { status: 422 },
      )
    },
  )
}
