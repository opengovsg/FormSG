import { VerifiableFieldBase, VerifiableFieldSchema } from './types'

export const isVerifiableFieldSchema = <T extends VerifiableFieldBase>(
  schema: T,
): schema is VerifiableFieldSchema<T> => {
  return schema.isVerifiable
}
