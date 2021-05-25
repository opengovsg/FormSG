import axios from 'axios'

import { FormUpdateParams } from 'src/app/modules/form/admin-form/admin-form.types'
import { PublicFormViewDto } from 'src/app/modules/form/public-form/public-form.types'
import {
  FormMetaView,
  IFormSchema,
  IPopulatedForm,
  PublicForm,
} from 'src/types'
import { FormFieldDto } from 'src/types/api'

// endpoints exported for testing
export const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'
export const PUBLIC_FORM_ENDPOINT = '/api/v3/forms'

export const queryForm = async (): Promise<FormMetaView[]> => {
  const instance = axios.create()
  return instance
    .get<FormMetaView[]>(`${ADMIN_FORM_ENDPOINT}`, {
      headers: { 'If-Modified-Since': '0' },
    })
    .then(({ data }) => data)
}

export const getAdminForm = async (
  formId: string,
  accessMode = 'adminform',
): Promise<{ form: IPopulatedForm }> => {
  const instance = axios.create()
  // disable IE ajax request caching (so new forms show on dashboard)
  return instance
    .get<{ form: IPopulatedForm }>(`/${formId}/${accessMode}`, {
      headers: { 'If-Modified-Since': '0' },
    })
    .then(({ data }) => data)
}

export const getPublicForm = async (
  formId: string,
): Promise<PublicFormViewDto> => {
  const instance = axios.create()
  // disable IE ajax request caching (so new forms show on dashboard)
  return instance
    .get<PublicFormViewDto>(`${PUBLIC_FORM_ENDPOINT}/${formId}`, {
      headers: { 'If-Modified-Since': '0' },
    })
    .then(({ data }) => data)
}

export const updateForm = async (
  formId: string,
  update: { form: FormUpdateParams },
  accessMode = 'adminform',
): Promise<IPopulatedForm> => {
  const instance = axios.create()
  return instance
    .put<IPopulatedForm>(`${formId}/${accessMode}`, update)
    .then(({ data }) => data)
}

export const saveForm = async (
  formId: string,
  formToSave: FormFieldDto[],
): Promise<FormMetaView> => {
  const instance = axios.create()
  return instance
    .post<FormMetaView>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
      formToSave,
    )
    .then(({ data }) => data)
}

export const deleteForm = async (formId: string): Promise<void> => {
  const instance = axios.create()
  return instance.delete(`${ADMIN_FORM_ENDPOINT}/${formId}`)
}

// createForm is called without formId, so the endpoint is just /adminform
export const createForm = async (newForm: {
  form: FormFieldDto[]
}): Promise<IFormSchema> => {
  const instance = axios.create()
  return instance
    .post<IFormSchema>(`${ADMIN_FORM_ENDPOINT}`, newForm)
    .then(({ data }) => data)
}

// Used for viewing templates with use-template or examples listing. Any logged in officer is authorized.
export const queryTemplate = async (
  formId: string,
  accessMode = 'adminform',
): Promise<{ form: PublicForm }> => {
  const instance = axios.create()
  return instance
    .get<{ form: PublicForm }>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/${accessMode}/template`,
    )
    .then(({ data }) => data)
}

// Used for previewing the form from the form admin page. Must be a viewer, collaborator or admin.
export const previewForm = async (
  formId: string,
): Promise<{ form: PublicForm }> => {
  const instance = axios.create()
  return instance
    .get<{ form: PublicForm }>(`${ADMIN_FORM_ENDPOINT}/${formId}/preview`)
    .then(({ data }) => data)
}

export const useTemplate = async (
  formId: string,
  accessMode = 'adminform',
): Promise<FormMetaView> => {
  const instance = axios.create()
  return instance
    .post<FormMetaView>(`${ADMIN_FORM_ENDPOINT}/${formId}/${accessMode}/copy`)
    .then(({ data }) => data)
}

export const transferOwner = async (
  formId: string,
  newOwner: { email: string },
): Promise<{ form: IPopulatedForm }> => {
  const instance = axios.create()
  return instance
    .post<{ form: IPopulatedForm }>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators/transfer-owner`,
      newOwner,
    )
    .then(({ data }) => data)
}
