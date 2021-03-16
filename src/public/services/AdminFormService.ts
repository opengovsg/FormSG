import axios from 'axios'

import { SettingsUpdateDto } from '../../shared/typings/form'
import { FormSettings } from '../../types'

const ADMIN_FORM_ENDPOINT = '/api/v3/admin/form'

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
