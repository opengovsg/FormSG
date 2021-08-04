import {
  BasicField,
  RatingFieldBase,
  RatingShape,
} from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { RatingFieldBase, RatingShape }
export interface IRatingFieldSchema extends RatingFieldBase, IFieldSchema {
  fieldType: BasicField.Rating
}
