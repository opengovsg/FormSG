import { Schema } from 'mongoose'

import {
  ILongTextFieldSchema,
  LongTextSelectedValidation,
} from '../../../types'

const createLongTextFieldSchema = () => {
  return new Schema<ILongTextFieldSchema>({
    ValidationOptions: {
      customMax: {
        type: Number,
        default: null,
      },
      customMin: {
        type: Number,
        default: null,
      },
      customVal: {
        type: Number,
        default: null,
      },
      selectedValidation: {
        type: String,
        enum: Object.values(LongTextSelectedValidation).concat([null]),
        default: null,
      },
    },
  })
}
export default createLongTextFieldSchema
