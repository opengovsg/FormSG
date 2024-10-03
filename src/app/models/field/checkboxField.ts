import { Schema } from 'mongoose'

import { Language } from '../../../../shared/types'
import { ICheckboxFieldSchema } from '../../../types'

const createCheckboxFieldSchema = () => {
  return new Schema<ICheckboxFieldSchema>({
    fieldOptions: {
      type: [String],
      validate: {
        validator: (optionsArray: string[]): boolean => {
          return optionsArray.length === new Set(optionsArray).size
        },
        message: 'Please ensure that there are no duplicate checkbox options.',
      },
    },
    fieldOptionsTranslations: {
      type: [
        {
          language: {
            type: String,
            enum: Object.values(Language),
          },
          translation: [String],
        },
      ],
      default: [],
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
