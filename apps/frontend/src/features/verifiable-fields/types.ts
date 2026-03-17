import type { EmailFieldBase, MobileFieldBase } from 'formsg-shared/types/field'

export type VerifiableFieldBase = MobileFieldBase | EmailFieldBase
export type VerifiableFieldType = VerifiableFieldBase['fieldType']

export type VerifiableFieldSchema<T extends VerifiableFieldBase> = T & {
  isVerifiable: true
}
