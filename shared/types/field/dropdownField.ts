import { TranslationOptionMapping } from '../form'
import { BasicField, MyInfoableFieldBase } from './base'

export interface DropdownFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Dropdown
  fieldOptions: string[]
  fieldOptionsTranslations?: TranslationOptionMapping[]
}
