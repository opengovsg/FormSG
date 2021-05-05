import { AuthType } from '../form'

export type LoginStatistic = {
  adminEmail: string
  formName: string
  total: number
  formId: string
  authType: AuthType
}
