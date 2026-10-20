import { AnalyticsEventInput } from 'formsg-shared/types'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const logAnalyticsEvent = (
  formId: string | undefined,
  event: AnalyticsEventInput,
): void => {
  if (!formId) return
  ApiService.post(`${ADMIN_FORM_ENDPOINT}/${formId}/analytics-events`, event)
    .then(() => undefined)
    .catch(() => undefined)
}
