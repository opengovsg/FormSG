import {
  FormSettings,
  FormStatus,
  SettingsUpdateDto,
} from '~shared/types/form/form'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

export const getFormSettings = async (
  formId: string,
): Promise<FormSettings> => {
  return ApiService.get<FormSettings>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/settings`,
  ).then(({ data }) => data)
}

export const updateFormStatus = async (
  formId: string,
  status: FormStatus,
): Promise<FormSettings> => {
  return updateFormSettings(formId, { status })
}

/**
 * Internal function that calls the PATCH API.
 * @param formId the id of the form to update
 * @param settingsToUpdate the partial settings object to update
 * @returns updated form settings
 */
const updateFormSettings = async (
  formId: string,
  settingsToUpdate: SettingsUpdateDto,
): Promise<FormSettings> => {
  return ApiService.patch<FormSettings>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/settings`,
    settingsToUpdate,
  ).then(({ data }) => data)
}
