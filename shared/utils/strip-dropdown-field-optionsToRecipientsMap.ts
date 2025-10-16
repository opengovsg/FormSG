import { BasicField, FormFieldDto } from '../types'

export function stripDropdownFieldOptionsToRecipientsMap(
  formFields: FormFieldDto[],
): FormFieldDto[] {
  return formFields.map((formField) => {
    if (formField.fieldType === BasicField.Dropdown) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { optionsToRecipientsMap, ...rest } = formField
      return rest
    }
    return formField
  })
}
