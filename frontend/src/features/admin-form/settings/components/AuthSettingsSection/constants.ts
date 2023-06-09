import { FormAuthType, FormResponseMode } from '~shared/types/form'

export type EmailFormAuthType = FormAuthType
export type StorageFormAuthType =
  | FormAuthType.NIL
  | FormAuthType.SP
  | FormAuthType.CP
  | FormAuthType.SGID

export const STORAGE_MODE_AUTHTYPES: Record<StorageFormAuthType, string> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.SGID]: 'Singpass App-only Login (Free)',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}

// Not using STORAGE_MODE_AUTHTYPES due to wanting a different order.
export const EMAIL_MODE_AUTHTYPES: Record<EmailFormAuthType, string> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.SGID]: 'Singpass App-only Login (Free)',
  [FormAuthType.MyInfo]: 'Singpass with MyInfo',
  [FormAuthType.SGID_MyInfo]: 'Singpass App-only Login (Free) with MyInfo',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}
export const AUTHTYPE_TO_TEXT = {
  [FormResponseMode.Email]: EMAIL_MODE_AUTHTYPES,
  [FormResponseMode.Encrypt]: STORAGE_MODE_AUTHTYPES,
}

export const SGID_TOOLTIP = `Free Singpass authentication via Singpass app QR\
  code login. Respondents must have the Singpass mobile app installed to log in\
  and submit responses. Password login is not supported. Form admin will receive\
  respondent's NRIC.`

export const CP_TOOLTIP = `Corppass no longer has its own login page, and now\
  uses Singpass to authenticate corporate users. You will still need a separate\
  Corppass e-service ID.`
