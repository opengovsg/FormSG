import {
  DropdownFieldBase,
  FieldCreateDto,
  FormFieldDto,
} from '~shared/types/field'

import { transformAllIsoStringsToDate } from '~utils/date'
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
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
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
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
}

export const updateOptionsToRecipientsMap = async ({
  formId,
  fieldId,
  optionsToRecipientsMap,
}: {
  formId: string
  fieldId: string
  optionsToRecipientsMap: DropdownFieldBase['optionsToRecipientsMap']
}): Promise<FormFieldDto> => {
  return ApiService.put<FormFieldDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/fields/${fieldId}/options-to-recipients-map`,
    { optionsToRecipientsMap },
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
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
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
}

/**
 * Duplicates a field, adding the new field as the last field in
 * the form.
 * @param formId the id of the form
 * @param fieldId the id of the field to duplicate
 * @returns the newly created field
 */
export const duplicateSingleFormField = async ({
  formId,
  fieldId,
}: {
  formId: string
  fieldId: string
}): Promise<FormFieldDto> => {
  return ApiService.post<FormFieldDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/fields/${fieldId}/duplicate`,
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
}

/**
 * Delete a single form field by its id in given form
 * @param formId the id of the form to delete the field from
 * @param fieldId the id of the field to delete
 * @returns void on success
 */
export const deleteSingleFormField = async ({
  formId,
  fieldId,
}: {
  formId: string
  fieldId: string
}): Promise<void> => {
  return ApiService.delete(`${ADMIN_FORM_ENDPOINT}/${formId}/fields/${fieldId}`)
}
