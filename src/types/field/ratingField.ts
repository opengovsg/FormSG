import { BasicField, RatingFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IRatingFieldSchema extends RatingFieldBase, IFieldSchema {
  fieldType: BasicField.Rating
}
