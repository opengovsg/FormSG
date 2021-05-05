import { Schema } from 'mongoose'

import { ILongTextFieldSchema, TextSelectedValidation } from 'src/types'

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
        enum: [...Object.values(TextSelectedValidation), null],
        default: null,
      },
    },
  })
}
export default createLongTextFieldSchema
