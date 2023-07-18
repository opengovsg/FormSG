import { FormAuthType, FormResponseMode } from '~shared/types/form'

export type EmailFormAuthType = FormAuthType
export type StorageFormAuthType =
  | FormAuthType.NIL
  | FormAuthType.SP
  | FormAuthType.CP
  | FormAuthType.SGID

export const NONE_AUTH_TEXT = 'None'
const BASIC_AUTH_TEXT = 'Login only'
const MYINFO_AUTH_TEXT = 'Login and capture MyInfo data'
const CORP_AUTH_TEXT = 'Corporate login'

export const STORAGE_MODE_SGID_AUTHTYPES_ORDERED: Partial<
  Record<StorageFormAuthType, string>
> = {
  [FormAuthType.SGID]: BASIC_AUTH_TEXT,
}

// Not using STORAGE_MODE_AUTHTYPES due to wanting a different order.
export const STORAGE_MODE_SINGPASS_AUTHTYPES_ORDERED: Partial<
  Record<StorageFormAuthType, string>
> = {
  [FormAuthType.SP]: BASIC_AUTH_TEXT,
  [FormAuthType.CP]: CORP_AUTH_TEXT,
}

export const EMAIL_MODE_SGID_AUTHTYPES_ORDERED: Partial<
  Record<EmailFormAuthType, string>
> = {
  [FormAuthType.SGID]: BASIC_AUTH_TEXT,
  [FormAuthType.SGID_MyInfo]: MYINFO_AUTH_TEXT,
}

export const EMAIL_MODE_SINGPASS_AUTHTYPES_ORDERED: Partial<
  Record<EmailFormAuthType, string>
> = {
  [FormAuthType.SP]: BASIC_AUTH_TEXT,
  [FormAuthType.MyInfo]: MYINFO_AUTH_TEXT,
  [FormAuthType.CP]: CORP_AUTH_TEXT,
}

export const CP_TOOLTIP = `Corppass no longer has its own login page, and now\
  uses Singpass to authenticate corporate users. You will still need a separate\
  Corppass e-service ID.`
