import { BasicField } from '~shared/types/field'

import { BASICFIELD_TO_READABLE } from '../constants'

import { PENDING_CREATE_FIELD_ID } from './constants'
import { BuilderContentField, PendingFormField } from './types'

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
    title: BASICFIELD_TO_READABLE[fieldType],
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
