import { BasicField, FieldBase, MyInfoAttribute } from './base'

export interface NricFieldBase extends FieldBase {
  fieldType: BasicField.Nric
  myInfo?: { attr: MyInfoAttribute.UinFin }
}
