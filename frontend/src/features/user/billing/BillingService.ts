import { BillingInfoDto, BillingQueryDto } from '~/../../shared/types'

import { ApiService } from '~services/ApiService'

const BILLING_ENDPOINT = '/billings'

/**
 * Gets the billing information for the given month and year
 * @param billingQueryParams The formId and the specific month to get the information for
 * @returns Promise<BillingResult> The billing statistics of the given month
 */
export const getBillingInfo = (
  billingQueryParams: BillingQueryDto,
): Promise<BillingInfoDto> => {
  return ApiService.get<BillingInfoDto>(BILLING_ENDPOINT, {
    params: billingQueryParams,
  }).then(({ data }) => data)
}
