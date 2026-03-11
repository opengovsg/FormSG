import {
  TextSelectedValidation,
  TextValidationOptions,
} from 'formsg-shared/types'
import { Schema } from 'mongoose'

export const TextValidationOptionsSchema = new Schema<TextValidationOptions>({
  customVal: {
    type: Number,
  },
  selectedValidation: {
    type: String,
    enum: [...Object.values(TextSelectedValidation), null],
  },
})
