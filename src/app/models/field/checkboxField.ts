import { Schema } from 'mongoose'

import { ICheckboxFieldSchema } from '../../../types'

const createCheckboxFieldSchema = () => {
  return new Schema<ICheckboxFieldSchema>({
    fieldOptions: {
      type: [String],
      validate: {
        validator: (optionsArray: string[]): boolean => {
          return optionsArray.length === new Set(optionsArray).size
        },
      },
    },
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
