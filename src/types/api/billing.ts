import { LoginStatistic } from '../../types'

export type BillingQueryDto = {
  esrvcId: string
  yr: string
  mth: string
}

export type BillingInformationDto = { loginStats: LoginStatistic[] }
