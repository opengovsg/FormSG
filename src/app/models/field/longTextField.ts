import { Schema } from 'mongoose'

import { ILongTextFieldSchema } from '../../../types'
import { TextSelectedValidation } from '../../../types/field/baseField'

const createLongTextFieldSchema = () => {
  return new Schema<ILongTextFieldSchema>({
    ValidationOptions: {
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
