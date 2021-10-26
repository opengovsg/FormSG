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
