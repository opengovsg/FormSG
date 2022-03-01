import { BasicField } from '~shared/types/field'

import { FIELDS_TO_CREATE_META, PENDING_CREATE_FIELD_ID } from './constants'
import { BuilderContentField, PendingFormField } from './types'

/**
 * Maps BasicField enums to their human-readable field type string
 */
export const transformBasicFieldToText = (basicField?: BasicField): string => {
  if (!basicField) return ''
  return FIELDS_TO_CREATE_META[basicField].label
}

export const isPendingFormField = (
  field: BuilderContentField,
): field is PendingFormField => {
  return field._id === PENDING_CREATE_FIELD_ID
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
    case BasicField.Checkbox: {
      return {
        fieldType,
        ...baseMeta,
        ValidationOptions: {
          customMax: null,
          customMin: null,
        },
        validateByValue: false,
        fieldOptions: ['Option 1'],
        othersRadioButton: false,
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
