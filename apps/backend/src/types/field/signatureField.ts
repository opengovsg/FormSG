import { BasicField, SignatureFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface ISignatureFieldSchema
  extends SignatureFieldBase, IFieldSchema {
  fieldType: BasicField.Signature
}
