import { Schema } from 'mongoose'

import { INumberFieldSchema, NumberSelectedValidation } from '../../../types'

import { MyInfoSchema } from './baseField'

const createNumberFieldSchema = () => {
  return new Schema<INumberFieldSchema>({
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
        enum: Object.values(NumberSelectedValidation).concat([null]),
        default: null,
      },
    },
  })
}
export default createNumberFieldSchema
