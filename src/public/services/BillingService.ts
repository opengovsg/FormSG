import axios from 'axios'

import { LoginStatistic } from 'src/types/login'

// Exported for testing
export const BILLING_ENDPOINT = '/billing'
type BillingResult = LoginStatistic

/**
 * Gets the billing information for the given month and year
 * @param yr The year to get the billing information for
 * @param mth The month to get the billing information for
 * @param esrvcId The id of the form
 * @returns Promise<BillingResult> The billing statistics of the given month
 */
export const getBillingInfo = (
  yr: string,
  mth: string,
  esrvcId: string,
): Promise<BillingResult> =>
  axios
    .get(BILLING_ENDPOINT, {
      params: {
        yr,
        mth,
        esrvcId,
      },
    })
    .then(({ data }) => data)
