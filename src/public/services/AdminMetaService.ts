import axios from 'axios'

/** Exported for testing */
export const FORM_API_PREFIX = '/api/v3/admin/forms'

/**
 * Retrieves the free sms counts used by the admin of a specified form
 * @param formId
 * @returns The amount of free sms counts used by the admin of the form
 */
export const getFreeSmsCountsUsedByFormAdmin = (
  formId: string,
): Promise<number> =>
  axios
    .get<number>(`${FORM_API_PREFIX}/${formId}/verified-sms/count/free`)
    .then(({ data }) => data)
