import { Schema } from 'mongoose'

import { ICheckboxFieldSchema } from '../../../types'

const createCheckboxFieldSchema = () => {
  return new Schema<ICheckboxFieldSchema>({
    fieldOptions: [String],
    othersRadioButton: {
      type: Boolean,
      default: false,
    },
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

export default createCheckboxFieldSchema
