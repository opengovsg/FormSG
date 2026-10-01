import {
  AllowCorppassBase,
  BasicField,
  CorppassAttribute,
  FieldBase,
} from './base'

export interface UenFieldBase
  extends FieldBase, AllowCorppassBase<CorppassAttribute.Uen> {
  fieldType: BasicField.Uen
}
