import { ResultsEventInput } from 'formsg-shared/types'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

export const logResultsEvent = (
  formId: string | undefined,
  event: ResultsEventInput,
): void => {
  if (!formId) return
  ApiService.post(`${ADMIN_FORM_ENDPOINT}/${formId}/results-events`, event)
    .then(() => undefined)
    .catch(() => undefined)
}
