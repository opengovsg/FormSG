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
 * Prefix for free-text "Others" answers in V1 radio/checkbox content.
 * Duplicated from packages/shared — the SDK deliberately takes no dependency
 * on it.
 */
export const OTHERS_PREFIX = 'Others: '

/**
 * Sentinel the form client stores in a checkbox value array when "Others" is
 * checked; the free text travels separately as `othersInput`. Duplicated
 * (name and value) from packages/shared — the SDK deliberately takes no
 * dependency on it.
 */
export const CLIENT_CHECKBOX_OTHERS_INPUT_VALUE =
  '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

export const ADDRESS_SUBFIELD_KEYS = [
  'postalCode',
  'blockNumber',
  'streetName',
  'buildingName',
  'levelNumber',
  'unitNumber',
] as const

/**
 * Address subfield order in a V1 content answerArray (postalCode last). Not
 * interchangeable with ADDRESS_SUBFIELD_KEYS (V3 record keys, postalCode
 * first) — using that order would silently scramble addresses.
 */
export const ADDRESS_V1_ANSWER_ORDER = [
  'blockNumber',
  'streetName',
  'buildingName',
  'levelNumber',
  'unitNumber',
  'postalCode',
] as const
