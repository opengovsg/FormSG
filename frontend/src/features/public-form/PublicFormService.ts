import { PublicFormAuthRedirectDto } from '~shared/types/form'
import { PublicFormViewDto } from '~shared/types/form/form'

import { ApiService } from '~services/ApiService'

const PUBLIC_FORMS_ENDPOINT = '/forms'

/**
 * Gets public view of form, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 * @param formId FormId of form in question
 * @returns Public view of form, with additional identify information
 */
export const getPublicFormView = async (
  formId: string,
): Promise<PublicFormViewDto> => {
  return ApiService.get<PublicFormViewDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}`,
  ).then(({ data }) => data)
}

/**
 * Gets the redirect url for public form login
 * @param formId form id of form to log in.
 * @param isPersistentLogin whether login is persistent; affects cookie lifetime.
 * @returns redirect url for public form login
 */
export const getPublicFormAuthRedirectUrl = async (
  formId: string,
  isPersistentLogin = false,
): Promise<PublicFormAuthRedirectDto['redirectURL']> => {
  return ApiService.get<PublicFormAuthRedirectDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/redirect`,
    {
      params: { isPersistentLogin },
    },
  ).then(({ data }) => data.redirectURL)
}
