import { FieldCreateDto, FormFieldDto } from '~shared/types/field'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

/**
 * Creates a new form field in the given form
 * @param formId the form to insert a new form field for
 * @param createFieldBody the body of the new form field
 * @param insertionIndex optional. The index to insert the new form field at
 * @returns the created form field
 */
export const createSingleFormField = async ({
  formId,
  createFieldBody,
  insertionIndex,
}: {
  formId: string
  createFieldBody: FieldCreateDto
  insertionIndex?: number
}): Promise<FormFieldDto> => {
  return ApiService.post<FormFieldDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/fields`,
    createFieldBody,
    { params: { to: insertionIndex } },
  ).then(({ data }) => data)
}

export const updateSingleFormField = async ({
  formId,
  updateFieldBody,
}: {
  formId: string
  updateFieldBody: FormFieldDto
}): Promise<FormFieldDto> => {
  return ApiService.put<FormFieldDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/fields/${updateFieldBody._id}`,
    updateFieldBody,
  ).then(({ data }) => data)
}

/**
 * Reorders the field to the given new position.
 * @param formId the id of the form to perform the field reorder
 * @param fieldId the id of the field to reorder
 * @param newPosition the position to move the field to
 * @returns the reordered form fields of the form corresponding to the formId
 */
export const reorderSingleFormField = async ({
  formId,
  fieldId,
  newPosition,
}: {
  formId: string
  fieldId: string
  newPosition: number
}): Promise<FormFieldDto[]> => {
  return ApiService.post<FormFieldDto[]>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/fields/${fieldId}/reorder`,
    {},
    { params: { to: newPosition } },
  ).then(({ data }) => data)
}
