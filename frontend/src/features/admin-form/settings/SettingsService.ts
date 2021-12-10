import {
  EmailFormSettings,
  FormSettings,
  SettingsUpdateDto,
} from '~shared/types/form/form'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

type UpdateEmailFormFn<T extends keyof EmailFormSettings> = (
  formId: string,
  settingsToUpdate: EmailFormSettings[T],
) => Promise<FormSettings>

type UpdateFormFn<T extends keyof FormSettings> = (
  formId: string,
  settingsToUpdate: FormSettings[T],
) => Promise<FormSettings>

export const getFormSettings = async (
  formId: string,
): Promise<FormSettings> => {
  return ApiService.get<FormSettings>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/settings`,
  ).then(({ data }) => data)
}

export const updateFormStatus: UpdateFormFn<'status'> = async (
  formId,
  status,
) => {
  return updateFormSettings(formId, { status })
}

export const updateFormLimit: UpdateFormFn<'submissionLimit'> = async (
  formId,
  newLimit,
) => {
  return updateFormSettings(formId, { submissionLimit: newLimit })
}

export const updateFormCaptcha: UpdateFormFn<'hasCaptcha'> = async (
  formId,
  newHasCaptcha,
) => {
  return updateFormSettings(formId, { hasCaptcha: newHasCaptcha })
}

export const updateFormInactiveMessage: UpdateFormFn<
  'inactiveMessage'
> = async (formId, newMessage) => {
  return updateFormSettings(formId, { inactiveMessage: newMessage })
}

export const updateFormTitle: UpdateFormFn<'title'> = async (
  formId,
  newTitle,
) => {
  return updateFormSettings(formId, { title: newTitle })
}

export const updateFormEmails: UpdateEmailFormFn<'emails'> = async (
  formId,
  newEmails,
) => {
  return updateFormSettings(formId, { emails: newEmails })
}

export const updateFormAuthType: UpdateFormFn<'authType'> = async (
  formId,
  newAuthType,
) => {
  return updateFormSettings(formId, { authType: newAuthType })
}

export const updateFormEsrvcId: UpdateFormFn<'esrvcId'> = async (
  formId,
  newEsrvcId,
) => {
  return updateFormSettings(formId, { esrvcId: newEsrvcId })
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
) => {
  return ApiService.patch<FormSettings>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/settings`,
    settingsToUpdate,
  ).then(({ data }) => data)
}
