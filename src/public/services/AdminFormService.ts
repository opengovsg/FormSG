import axios from 'axios'

import { FormSettings } from '../../types'
import {
  FieldCreateDto,
  FieldUpdateDto,
  FormFieldDto,
  SettingsUpdateDto,
} from '../../types/api'

const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'

export const updateFormSettings = async (
  formId: string,
  settingsToUpdate: SettingsUpdateDto,
): Promise<FormSettings> => {
  return axios
    .patch<FormSettings>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/settings`,
      settingsToUpdate,
    )
    .then(({ data }) => data)
}

export const updateSingleFormField = async (
  formId: string,
  fieldId: string,
  updateFieldBody: FieldUpdateDto,
): Promise<FieldUpdateDto> => {
  return axios
    .put<FieldUpdateDto>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/fields/${fieldId}`,
      updateFieldBody,
    )
    .then(({ data }) => data)
}

export const createSingleFormField = async (
  formId: string,
  createFieldBody: FieldCreateDto,
): Promise<FormFieldDto> => {
  return axios
    .post<FormFieldDto>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/fields`,
      createFieldBody,
    )
    .then(({ data }) => data)
}

export const deleteFormLogic = async (
  formId: string,
  logicId: string,
): Promise<true> => {
  return axios.delete(`${ADMIN_FORM_ENDPOINT}/${formId}/logic/${logicId}`)
}
