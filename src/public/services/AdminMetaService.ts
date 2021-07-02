import axios from 'axios'

import { SmsCountsDto } from '../../types/api'

/** Exported for testing */
export const FORM_API_PREFIX = '/api/v3/admin/forms'

/**
 * Retrieves the free sms counts used by the admin of a specified form
 * @param formId
 * @returns The amount of free sms counts used by the admin of the form
 */
export const getSmsVerificationStateForFormAdmin = (
  formId: string,
): Promise<SmsCountsDto> =>
  axios
    .get<SmsCountsDto>(`${FORM_API_PREFIX}/${formId}/verified-sms/count/free`)
    .then(({ data }) => data)
