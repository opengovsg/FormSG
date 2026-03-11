import { BasicField, RatingFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IRatingFieldSchema extends RatingFieldBase, IFieldSchema {
  fieldType: BasicField.Rating
}
