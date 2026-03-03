import { Schema } from 'mongoose'

import {
  TextSelectedValidation,
  TextValidationOptions,
} from '../../../../../shared/types'

export const TextValidationOptionsSchema = new Schema<TextValidationOptions>({
  customVal: {
    type: Number,
  },
  selectedValidation: {
    type: String,
    enum: [...Object.values(TextSelectedValidation), null],
  },
})
