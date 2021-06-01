import axios from 'axios'

import {
  DuplicateFormBody,
  FormUpdateParams,
} from 'src/app/modules/form/admin-form/admin-form.types'
import { PublicFormViewDto } from 'src/app/modules/form/public-form/public-form.types'
import {
  FormMetaView,
  IForm,
  IFormSchema,
  IPopulatedForm,
  PublicForm,
} from 'src/types'

// endpoints exported for testing
export const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'
export const PUBLIC_FORM_ENDPOINT = '/api/v3/forms'

/**
 * Gets metadata for all forms in dashboard view i.e. forms which user
 * owns or collaborates on
 * @returns Metadata required for forms on dashboard view
 */
export const getDashboardView = async (): Promise<FormMetaView[]> => {
  return axios
    .get<FormMetaView[]>(`${ADMIN_FORM_ENDPOINT}`)
    .then(({ data }) => data)
}

/**
 * Gets admin view of form.
 * @param formId formId of form in question
 * @returns Admin view of form
 */
export const getAdminFormView = async (
  formId: string,
): Promise<{ form: IPopulatedForm }> => {
  // disable IE ajax request caching (so new forms show on dashboard)
  return axios
    .get<{ form: IPopulatedForm }>(`/${formId}/adminform`)
    .then(({ data }) => data)
}

/**
 * Gets public view of form, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 * @param formId FormId of form in question
 * @returns Public view of form, with additional identify information
 */
export const getPublicFormView = async (
  formId: string,
): Promise<PublicFormViewDto> => {
  // disable IE ajax request caching (so new forms show on dashboard)
  return axios
    .get<PublicFormViewDto>(`${PUBLIC_FORM_ENDPOINT}/${formId}`)
    .then(({ data }) => data)
}

/**
 * Updates FormUpdateParams attribute(s) in the corresponding form.
 * @deprecated This function should no longer be called
 * @param formId formId of form in question
 * @returns Updated form
 */
export const updateForm = async (
  formId: string,
  update: { form: FormUpdateParams },
): Promise<IPopulatedForm> => {
  return axios
    .put<IPopulatedForm>(`${formId}/adminform`, update)
    .then(({ data }) => data)
}

/**
 * Duplicates the form
 * @param formId formId of form to be duplicated
 * @param duplicateFormBody Title, response mode and relevant information for new form
 * @returns Metadata of duplicated form for dashboard view
 */
export const duplicateForm = async (
  formId: string,
  duplicateFormBody: DuplicateFormBody,
): Promise<FormMetaView> => {
  return axios
    .post<FormMetaView>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
      duplicateFormBody,
    )
    .then(({ data }) => data)
}

/**
 * Deletes the form with the corresponding formId
 * @param formId formId of form to delete
 */
export const deleteForm = async (formId: string): Promise<void> => {
  return axios.delete(`${ADMIN_FORM_ENDPOINT}/${formId}`)
}

/**
 * Creates a new form. This function is called without formId, so the endpoint is just /adminform.
 * @param newForm Form fields to newly created form
 * @returns Newly created form.
 */
export const createForm = async (
  newForm: Omit<IForm, 'admin'>,
): Promise<IFormSchema> => {
  return axios
    .post<IFormSchema>(`${ADMIN_FORM_ENDPOINT}`, newForm)
    .then(({ data }) => data)
}

/**
 * Only used by examples page.
 * Queries templates with use-template or examples listings. Any logged in officer is authorized.
 * @param formId formId of template in question
 * @returns Public view of a template
 */
export const queryTemplate = async (
  formId: string,
): Promise<{ form: PublicForm }> => {
  return axios
    .get<{ form: PublicForm }>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/adminform/template`,
    )
    .then(({ data }) => data)
}

/**
 * Gets the public view of a form. Used for previewing the form from the form admin page.
 * Must be a viewer, collaborator or admin.
 * @param formId formId of template in question
 * @returns Public view of a form
 */
export const previewForm = async (
  formId: string,
): Promise<{ form: PublicForm }> => {
  return axios
    .get<{ form: PublicForm }>(`${ADMIN_FORM_ENDPOINT}/${formId}/preview`)
    .then(({ data }) => data)
}

/**
 * Used to create a new form from an existing template.
 * @param formId formId of template to base the new form on
 * @returns Metadata for newly created form in dashboard view
 */
export const useTemplate = async (formId: string): Promise<FormMetaView> => {
  return axios
    .post<FormMetaView>(`${ADMIN_FORM_ENDPOINT}/${formId}/adminform/copy`)
    .then(({ data }) => data)
}

/**
 * Transfers ownership of form to another user with the given email.
 * @param newOwner Object with email of the new owner.
 * @returns Updated form with new ownership.
 */
export const transferOwner = async (
  formId: string,
  newOwner: { email: string },
): Promise<{ form: IPopulatedForm }> => {
  return axios
    .post<{ form: IPopulatedForm }>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators/transfer-owner`,
      newOwner,
    )
    .then(({ data }) => data)
}
