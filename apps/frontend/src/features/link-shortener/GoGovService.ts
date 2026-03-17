import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

const GOGOV_ENDPOINT = 'gogov'

export const getGoLinkSuffix = async (formId: string): Promise<unknown> => {
  return ApiService.get(
    `${ADMIN_FORM_ENDPOINT}/${formId}/${GOGOV_ENDPOINT}`,
  ).then(({ data }) => data)
}

export const claimGoLink = async (
  linkSuffix: string,
  formId: string,
  adminEmail: string,
): Promise<void> => {
  return ApiService.post(`${ADMIN_FORM_ENDPOINT}/${formId}/${GOGOV_ENDPOINT}`, {
    linkSuffix,
    adminEmail,
  }).then(({ data }) => data)
}
