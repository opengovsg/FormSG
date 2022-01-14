import { BasicField } from '~shared/types/field'

import { PENDING_CREATE_FIELD_ID } from './constants'
import { PendingFormField } from './types'

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

/**
 * Utility methods to create bare minimum meta required for field creation.
 * TODO: Create one for every field type.
 */
export const getFieldCreationMeta = (
  fieldType: BasicField,
): PendingFormField => {
  const baseMeta: Pick<
    PendingFormField,
    'description' | 'disabled' | 'required' | 'title' | '_id'
  > = {
    description: '',
    disabled: false,
    required: true,
    title: transformBasicFieldToText(fieldType),
    _id: PENDING_CREATE_FIELD_ID,
  }

  switch (fieldType) {
    case BasicField.Section: {
      return {
        fieldType,
        ...baseMeta,
      }
    }
    default: {
      return {
        fieldType: BasicField.Section,
        ...baseMeta,
      }
    }
  }
}
