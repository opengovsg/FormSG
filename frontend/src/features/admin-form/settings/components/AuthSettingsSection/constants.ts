import { FormAuthType } from '~shared/types/form'

type FormSingpassAuthType = Exclude<FormAuthType, FormAuthType.NIL>

export const FORM_SINGPASS_AUTHTYPES: Record<FormSingpassAuthType, string> = {
  [FormAuthType.SGID]: 'Singpass App-only Login',
  [FormAuthType.SGID_MyInfo]: 'Singpass App-only with Myinfo',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.MyInfo]: 'Singpass with Myinfo',
  [FormAuthType.CP]: 'Singpass (Corporate)',
}
