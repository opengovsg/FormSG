import { FormAuthType } from 'formsg-shared/types/form'

type FormSingpassAuthType = Exclude<FormAuthType, FormAuthType.NIL>

export const FORM_SINGPASS_AUTHTYPES: Partial<
  Record<FormSingpassAuthType, string>
> = {
  [FormAuthType.MyInfo]: 'Singpass',
  [FormAuthType.CP]: 'Corppass',
}
