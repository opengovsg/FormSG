import axios from 'axios'

import { SmsCountsDto } from '../../types/api'

/** Exported for testing */
export const FORM_API_PREFIX = '/api/v3'
export const SMS_ENDPOINT = 'sms'

/**
 * Retrieves the sms verifications metadata from the backend for the admin of a specified form
 * @param formId
 * @returns
 */
export const getSmsVerificationStateForFormAdmin = (
  formId: string,
): Promise<SmsCountsDto> =>
  axios
    .get<SmsCountsDto>(`${FORM_API_PREFIX}/${SMS_ENDPOINT}/${formId}`)
    .then(({ data }) => data)
