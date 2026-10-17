import { AgencyDto } from './agency'
import { FormAuthType, FormDto } from './form/form'
import { UserDto } from './user'

/**
 * Auth types that forms can no longer be set to, but which remain on login
 * records stored before they were removed. Kept so that billing for past
 * months still validates and is labelled correctly.
 */
export enum LegacyLoginAuthType {
  SP = 'SP',
}

// Single source of truth for the auth types a login record may hold.
export const LoginAuthType = { ...FormAuthType, ...LegacyLoginAuthType }
export type LoginAuthType = (typeof LoginAuthType)[keyof typeof LoginAuthType]

/**
 * The name `Login` may cause confusion.
 * This type relates to the data stored when a form respondent logs in to the
 * form via any of the public form auth methods (Singpass, Corppass, MyInfo,
 * etc).
 */
export type LoginBase = {
  admin: UserDto['_id']
  form: FormDto['_id']
  agency: AgencyDto['_id']
  authType: LoginAuthType
  // A login must be for a form that has an esrvcId.
  esrvcId: NonNullable<FormDto['esrvcId']>
}

export type FormBillingStatistic = {
  adminEmail: UserDto['email']
  formName: FormDto['title']
  formId: FormDto['_id']
  authType: LoginAuthType
  total: number
}

// yr: The year to get the billing information for
// mth: The month to get the billing information for
// esrvcId: The id of the form
export type BillingQueryDto = {
  esrvcId: NonNullable<FormDto['esrvcId']>
  yr: string
  mth: string
}

export type BillingInfoDto = { loginStats: FormBillingStatistic[] }
