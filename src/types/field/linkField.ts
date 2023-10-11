import { BasicField, LinkFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface ILinkFieldSchema extends LinkFieldBase, IFieldSchema {
  fieldType: BasicField.Link
}
