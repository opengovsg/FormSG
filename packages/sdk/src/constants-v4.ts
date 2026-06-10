import { FieldType } from './types'

export const GENERIC_STRING_FIELD_TYPES = new Set<FieldType>([
  'section',
  'statement',
  'image',
  'number',
  'decimal',
  'textfield',
  'textarea',
  'homeno',
  'dropdown',
  'rating',
  'nric',
  'uen',
  'date',
  'country_region',
])

/**
 * Prefix prepended to free-text "Others" answers when rendering radio and
 * checkbox responses as V1 content. Duplicated from the application's shared
 * constants — the SDK deliberately has no dependency on packages/shared.
 */
export const OTHERS_PREFIX = 'Others: '

export const ADDRESS_SUBFIELD_KEYS = [
  'postalCode',
  'blockNumber',
  'streetName',
  'buildingName',
  'levelNumber',
  'unitNumber',
] as const
