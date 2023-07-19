import { FormAuthType } from '~shared/types/form'

export type EmailFormAuthType = FormAuthType
export type StorageFormAuthType =
  | FormAuthType.NIL
  | FormAuthType.SP
  | FormAuthType.CP
  | FormAuthType.SGID

export const NONE_AUTH_TEXT = 'None'
const BASIC_AUTH_TEXT = 'Login only'
const MYINFO_AUTH_TEXT = 'Login and capture Myinfo data'
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

// Visually, the FormAuthType texts are no different,
// only the section they are under dinstiguishes them.
// Thus, this is used for aria-labels to make Radio buttons easier to dinstiguish.
export const AUTHTYPE_TO_REAL_NAME: Record<FormAuthType, string> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.SGID]: 'Singpass App-only Login (Free)',
  [FormAuthType.MyInfo]: 'Singpass with Myinfo',
  [FormAuthType.CP]: 'Singpass (Corporate)',
  [FormAuthType.SGID_MyInfo]: 'Singpass App-only Login with MyInfo (Free)',
}
