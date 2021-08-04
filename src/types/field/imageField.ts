import { BasicField, ImageFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { ImageFieldBase }

export interface IImageFieldSchema extends ImageFieldBase, IFieldSchema {
  fieldType: BasicField.Image
}
