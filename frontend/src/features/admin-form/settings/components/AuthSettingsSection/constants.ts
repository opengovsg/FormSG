import { FormAuthType, FormResponseMode } from '~shared/types/form'

export type EmailFormAuthType = FormAuthType
export type StorageFormAuthType =
  | FormAuthType.NIL
  | FormAuthType.SP
  | FormAuthType.CP

export const STORAGE_MODE_AUTHTYPES: Record<StorageFormAuthType, string> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}

// Not using STORAGE_MODE_AUTHTYPES due to wanting a different order.
export const EMAIL_MODE_AUTHTYPES: Record<EmailFormAuthType, string> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.SGID]: 'Singpass App-only Login (Free)',
  [FormAuthType.MyInfo]: 'Singpass with MyInfo',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}
export const AUTHTYPE_TO_TEXT = {
  [FormResponseMode.Email]: EMAIL_MODE_AUTHTYPES,
  [FormResponseMode.Encrypt]: STORAGE_MODE_AUTHTYPES,
}
