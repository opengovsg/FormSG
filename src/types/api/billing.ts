import { AuthType } from '../../types'

// yr: The year to get the billing information for
// mth: The month to get the billing information for
// esrvcId: The id of the form
export type BillingQueryDto = {
  esrvcId: string
  yr: string
  mth: string
}

// NOTE: LoginStatistic is defined here and in src/types/login.
// This is to allow the communication layer (the dto) to be agnostic of intermediate representations.
type LoginStatistic = {
  adminEmail: string
  formName: string
  total: number
  formId: string
  authType: AuthType
}

export type BillingInfoDto = { loginStats: LoginStatistic[] }
