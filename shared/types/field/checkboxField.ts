import { TranslationOptionMapping } from '../form'
import { BasicField, FieldBase } from './base'

export type CheckboxValidationOptions = {
  customMax: number | '' | null
  customMin: number | '' | null
}

export interface CheckboxFieldBase extends FieldBase {
  fieldType: BasicField.Checkbox
  fieldOptions: string[]
  fieldOptionsTranslations?: TranslationOptionMapping[]
  othersRadioButton: boolean
  ValidationOptions: CheckboxValidationOptions
  validateByValue: boolean
}
