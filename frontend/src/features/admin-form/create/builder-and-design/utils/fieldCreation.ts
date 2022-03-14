import { BasicField, FieldCreateDto } from '~shared/types/field'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'

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
    title: BASICFIELD_TO_DRAWER_META[fieldType].label,
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
