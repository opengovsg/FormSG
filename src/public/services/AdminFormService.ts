import axios from 'axios'

const ADMIN_FORM_ENDPOINT = '/api/v1/admin/form'

// TODO: Sync up these types with SettingsUpdateBody in admin-form.types.ts
type SettingsUpdateBody = Partial<{
  authType: string
  emails: string | string[]
  esrvcId: string
  hasCaptcha: boolean
  inactiveMessage: string
  status: string
  submissionLimit: number | null
  title: string
  webhook: {
    url: string
  }
}>

type SettingsUpdateResult = SettingsUpdateBody

export const updateFormSettings = async (
  formId: string,
  settingsToUpdate: SettingsUpdateBody,
): Promise<SettingsUpdateResult> => {
  return axios
    .patch<SettingsUpdateResult>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/settings`,
      settingsToUpdate,
    )
    .then(({ data }) => data)
}
