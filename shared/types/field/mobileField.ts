import { MyInfoableFieldBase, VerifiableFieldBase } from './base'

export interface MobileFieldBase
  extends MyInfoableFieldBase,
    VerifiableFieldBase {
  allowIntlNumbers: boolean
}
