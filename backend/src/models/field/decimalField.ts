import { Schema } from 'mongoose'

import { IDecimalFieldSchema } from '@root/types'

const createDecimalFieldSchema = () => {
  return new Schema<IDecimalFieldSchema>({
    ValidationOptions: {
      customMax: {
        type: Number,
        default: null,
      },
      customMin: {
        type: Number,
        default: null,
      },
    },
    validateByValue: {
      type: Boolean,
      default: false,
    },
  })
}
export default createDecimalFieldSchema
