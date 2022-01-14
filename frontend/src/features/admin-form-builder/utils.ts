import { BasicField } from '~shared/types/field'

/**
 * Maps BasicField enums to their human-readable field type string
 */
export const transformBasicFieldToText = (basicField?: BasicField): string => {
  if (!basicField) return ''
  switch (basicField) {
    case BasicField.Section:
      return 'Header'
    case BasicField.Statement:
      return 'Paragraph'
    case BasicField.Mobile:
      return 'Mobile Number'
    case BasicField.HomeNo:
      return 'Home Number'
    case BasicField.ShortText:
      return 'Short Answer'
    case BasicField.LongText:
      return 'Long Answer'
    case BasicField.YesNo:
      return 'Yes/No'
    case BasicField.Nric:
      return 'NRIC'
    case BasicField.Uen:
      return 'UEN'
    default:
      return basicField.charAt(0).toUpperCase() + basicField.slice(1)
  }
}
