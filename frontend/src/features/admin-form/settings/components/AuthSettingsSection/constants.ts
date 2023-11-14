import { FormAuthType, FormResponseMode } from '~shared/types/form'

export type EmailFormAuthType = FormAuthType
export type StorageFormAuthType = FormAuthType

export const FORM_AUTHTYPES: Record<
  StorageFormAuthType | EmailFormAuthType,
  string
> = {
  [FormAuthType.NIL]: 'None',
  [FormAuthType.SGID]: 'Singpass App-only Login',
  [FormAuthType.SGID_MyInfo]: 'Singpass App-only with Myinfo',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.MyInfo]: 'Singpass with Myinfo',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}
