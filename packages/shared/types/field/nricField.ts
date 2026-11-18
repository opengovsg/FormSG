import {
  AllowCorppassBase,
  BasicField,
  CorppassAttribute,
  FieldBase,
  MyInfoAttribute,
} from './base'

export interface NricFieldBase
  extends FieldBase, AllowCorppassBase<CorppassAttribute.Uid> {
  fieldType: BasicField.Nric
  myInfo?: { attr: MyInfoAttribute.UinFin }
}
