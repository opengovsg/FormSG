import { EndPageUpdateDto } from '~shared/types'

import { ApiService } from '~services/ApiService'

const ADMIN_FORM_ENDPOINT = 'admin/forms'

/**
 * Updates the end page for the given form referenced by its id
 *
 * @param formId the id of the form to update end page for
 * @param newEndPage the new endpage to replace with
 * @returns the updated end page on success
 */
export const updateFormEndPage = async (
  formId: string,
  newEndPage: EndPageUpdateDto,
): Promise<EndPageUpdateDto> => {
  return ApiService.put<EndPageUpdateDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/end-page`,
    newEndPage,
  ).then(({ data }) => data)
}
