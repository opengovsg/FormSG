import axios from 'axios'

import { FormMetaView, IForm, IFormSchema } from '../../types'
import { DuplicateFormBody } from '../../types/api'

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
