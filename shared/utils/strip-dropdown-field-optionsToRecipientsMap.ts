import { omit } from 'lodash'
import { BasicField, FormFieldDto } from '../types'

export function stripDropdownFieldOptionsToRecipientsMap(
  formFields: FormFieldDto[],
): FormFieldDto[] {
  return formFields.map((formField) => {
    if (formField.fieldType === BasicField.Dropdown) {
      return omit(formField, 'optionsToRecipientsMap')
    }
    return formField
  })
}
