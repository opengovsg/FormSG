import { LoginStatistic } from '../billing'

// yr: The year to get the billing information for
// mth: The month to get the billing information for
// esrvcId: The id of the form
export type BillingQueryDto = {
  esrvcId: string
  yr: string
  mth: string
}

export type BillingInfoDto = { loginStats: LoginStatistic[] }
