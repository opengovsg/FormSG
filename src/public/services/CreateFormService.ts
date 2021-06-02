import axios from 'axios'

import { DuplicateFormBody } from 'src/app/modules/form/admin-form/admin-form.types'
import { FormMetaView, IForm, IFormSchema } from 'src/types'

// endpoints exported for testing
export const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'

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
 * Creates a new form. This function is called without formId, so the endpoint is just /adminform.
 * @param newForm Form fields to newly created form
 * @returns Newly created form.
 */
export const createForm = async (
  newForm: Omit<IForm, 'admin'>,
): Promise<IFormSchema> => {
  return axios
    .post<IFormSchema>(`${ADMIN_FORM_ENDPOINT}`, { form: newForm })
    .then(({ data }) => data)
}

/**
 * Deletes the form with the corresponding formId
 * @param formId formId of form to delete
 */
export const deleteForm = async (
  formId: string,
): Promise<{ message: string }> => {
  return axios
    .delete(`${ADMIN_FORM_ENDPOINT}/${formId}`)
    .then(({ data }) => data)
}
