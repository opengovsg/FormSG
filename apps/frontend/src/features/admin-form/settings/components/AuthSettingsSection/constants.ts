import { FormAuthType } from 'formsg-shared/types/form'

type FormSingpassAuthType = Exclude<FormAuthType, FormAuthType.NIL>

export const FORM_SINGPASS_AUTHTYPES: Record<FormSingpassAuthType, string> = {
  [FormAuthType.MyInfo]: 'Singpass',
  [FormAuthType.CP]: 'Corppass',
}
