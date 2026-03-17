import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const getPaymentGuideLink = async (): Promise<string> => {
  return ApiService.get<string>(`${ADMIN_FORM_ENDPOINT}/guide/payments`).then(
    ({ data }) => data,
  )
}
