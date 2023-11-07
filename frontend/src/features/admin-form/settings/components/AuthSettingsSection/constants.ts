import { FormAuthType, FormResponseMode } from '~shared/types/form'

export type EmailFormAuthType = FormAuthType
export type StorageFormAuthType = FormAuthType

const FORM_AUTHTYPES: Record<StorageFormAuthType | EmailFormAuthType, string> =
  {
    [FormAuthType.NIL]: 'None',
    [FormAuthType.SGID]: 'Singpass App-only Login',
    [FormAuthType.SGID_MyInfo]: 'Singpass App-only with Myinfo',
    [FormAuthType.SP]: 'Singpass',
    [FormAuthType.MyInfo]: 'Singpass with Myinfo',
    [FormAuthType.CP]: 'Singpass (Corporate)',
  }

export const STORAGE_MODE_AUTHTYPES = FORM_AUTHTYPES
export const EMAIL_MODE_AUTHTYPES = FORM_AUTHTYPES

export const AUTHTYPE_TO_TEXT = {
  [FormResponseMode.Email]: EMAIL_MODE_AUTHTYPES,
  [FormResponseMode.Encrypt]: STORAGE_MODE_AUTHTYPES,
}
