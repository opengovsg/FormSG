import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

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

type Interceptor = {
  response: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>
  request: (
    config: AxiosRequestConfig,
  ) => AxiosRequestConfig | Promise<AxiosRequestConfig>
  responseError: ((response: AxiosResponse) => unknown) | null
}

export const queryForm = async (
  interceptor: Interceptor,
): Promise<FormMetaView[]> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .get<FormMetaView[]>(`${ADMIN_FORM_ENDPOINT}`, {
      headers: { 'If-Modified-Since': '0' },
    })
    .then(({ data }) => data)
}

export const getAdminForm = async (
  formId: string,
  interceptor: Interceptor,
  accessMode = 'adminform',
): Promise<{ form: IPopulatedForm }> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  // disable IE ajax request caching (so new forms show on dashboard)
  return instance
    .get<{ form: IPopulatedForm }>(`/${formId}/${accessMode}`, {
      headers: { 'If-Modified-Since': '0' },
    })
    .then(({ data }) => data)
}

export const getPublicForm = async (
  formId: string,
  interceptor: Interceptor,
): Promise<PublicFormViewDto> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
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
  interceptor: Interceptor,
  accessMode = 'adminform',
): Promise<IPopulatedForm> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .put<IPopulatedForm>(`${formId}/${accessMode}`, update)
    .then(({ data }) => data)
}

export const saveForm = async (
  formId: string,
  formToSave: FormFieldDto[],
  interceptor: Interceptor,
): Promise<FormMetaView> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .post<FormMetaView>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
      formToSave,
    )
    .then(({ data }) => data)
}

export const deleteForm = async (
  formId: string,
  interceptor: Interceptor,
): Promise<void> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance.delete(`${ADMIN_FORM_ENDPOINT}/${formId}`)
}

// createForm is called without formId, so the endpoint is just /adminform
export const createForm = async (
  newForm: { form: FormFieldDto[] },
  interceptor: Interceptor,
): Promise<IFormSchema> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .post<IFormSchema>(`${ADMIN_FORM_ENDPOINT}`, newForm)
    .then(({ data }) => data)
}

// Used for viewing templates with use-template or examples listing. Any logged in officer is authorized.
export const queryTemplate = async (
  formId: string,
  interceptor: Interceptor,
  accessMode = 'adminform',
): Promise<{ form: PublicForm }> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .get<{ form: PublicForm }>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/${accessMode}/template`,
    )
    .then(({ data }) => data)
}

// Used for previewing the form from the form admin page. Must be a viewer, collaborator or admin.
export const previewForm = async (
  formId: string,
  interceptor: Interceptor,
): Promise<{ form: PublicForm }> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .get<{ form: PublicForm }>(`${ADMIN_FORM_ENDPOINT}/${formId}/preview`)
    .then(({ data }) => data)
}

export const useTemplate = async (
  formId: string,
  interceptor: Interceptor,
  accessMode = 'adminform',
): Promise<FormMetaView> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .post<FormMetaView>(`${ADMIN_FORM_ENDPOINT}/${formId}/${accessMode}/copy`)
    .then(({ data }) => data)
}

export const transferOwner = async (
  formId: string,
  newOwner: { email: string },
  interceptor: Interceptor,
): Promise<{ form: IPopulatedForm }> => {
  const instance = axios.create()
  _addInterceptor(instance, interceptor)
  return instance
    .post<{ form: IPopulatedForm }>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators/transfer-owner`,
      newOwner,
    )
    .then(({ data }) => data)
}

/**
 * Adds both a response and request interceptor to the axios instance
 * @param instance Axios Instance created for a specific API call
 * @param interceptor Interceptor for API call
 */
const _addInterceptor = (instance: AxiosInstance, interceptor: Interceptor) => {
  const responseError = interceptor.responseError
  if (responseError) {
    instance.interceptors.response.use(
      (response) => interceptor.response(response),
      (response) => responseError(response),
    )
  } else {
    instance.interceptors.response.use((response) =>
      interceptor.response(response),
    )
  }
  instance.interceptors.request.use((config) => interceptor.request(config))
}
