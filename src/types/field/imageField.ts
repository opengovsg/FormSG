import { BasicField, ImageFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IImageFieldSchema extends ImageFieldBase, IFieldSchema {
  fieldType: BasicField.Image
}
