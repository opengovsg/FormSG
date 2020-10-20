import { Schema } from 'mongoose'

import { IShortTextFieldSchema } from '../../../types'
import { TextSelectedValidation } from '../../../types/field/baseField'

import { MyInfoSchema } from './baseField'

const createShortTextFieldSchema = () => {
  return new Schema<IShortTextFieldSchema>({
    myInfo: MyInfoSchema,
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

export default createShortTextFieldSchema
