import axios from 'axios'

import {
  AdminFormDto,
  AdminFormViewDto,
  PreviewFormViewDto,
} from '~shared/types/form/form'

import { ApiService } from '~services/ApiService'

// endpoint exported for testing
export const ADMIN_FORM_ENDPOINT = 'admin/forms'

/**
 * Gets admin view of form.
 * @param formId formId of form in question
 * @returns Admin view of form
 */
export const getAdminFormView = async (
  formId: string,
): Promise<AdminFormDto> => {
  return ApiService.get<AdminFormViewDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}`,
  ).then(({ data }) => data.form)
}

/**
 * Gets the public view of a form. Used for previewing the form from the form admin page.
 * Must be a viewer, collaborator or admin.
 * @param formId formId of form in question
 * @returns Public view of a form
 */
export const previewForm = async (
  formId: string,
): Promise<PreviewFormViewDto> => {
  return axios
    .get<PreviewFormViewDto>(`${ADMIN_FORM_ENDPOINT}/${formId}/preview`)
    .then(({ data }) => data)
}
