import { BasicField, FieldCreateDto } from '~shared/types/field'

import { FIELDS_TO_CREATE_META, PENDING_CREATE_FIELD_ID } from './constants'

/**
 * Maps BasicField enums to their human-readable field type string
 */
export const transformBasicFieldToText = (basicField?: BasicField): string => {
  if (!basicField) return ''
  return FIELDS_TO_CREATE_META[basicField].label
}

/**
 * Utility methods to create bare minimum meta required for field creation.
 * TODO: Create one for every field type.
 */
export const getFieldCreationMeta = (fieldType: BasicField): FieldCreateDto => {
  const baseMeta: Pick<
    FieldCreateDto,
    'description' | 'disabled' | 'required' | 'title'
  > = {
    description: '',
    disabled: false,
    required: true,
    title: transformBasicFieldToText(fieldType),
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
