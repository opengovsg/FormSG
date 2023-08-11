import { Schema } from 'mongoose'

import {
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
  NumberValidationOptions,
} from '../../../../shared/types'
import { INumberFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createNumberFieldSchema = () => {
  const ValidationOptionsSchema = new Schema<NumberValidationOptions>({
    selectedValidation: {
      type: String,
      enum: [...Object.values(NumberSelectedValidation), null],
    },
    LengthValidationOptions: {
      customVal: {
        type: Number,
      },
      selectedLengthValidation: {
        type: String,
        enum: [...Object.values(NumberSelectedLengthValidation), null],
      },
    },
    RangeValidationOptions: {
      customMin: {
        type: Number,
      },
      customMax: {
        type: Number,
      },
    },
  })

  const NumberFieldSchema = new Schema<INumberFieldSchema>({
    myInfo: MyInfoSchema,
    ValidationOptions: {
      type: ValidationOptionsSchema,
      default: {
        // Defaults are defined here because subdocument paths are undefined by default, and Mongoose does not apply subdocument defaults unless you set the subdocument path to a non-nullish value (see https://mongoosejs.com/docs/subdocs.html)
        selectedValidation: null,
        LengthValidationOptions: {
          customVal: null,
          selectedLengthValidation: null,
        },
        RangeValidationOptions: {
          customMin: null,
          customMax: null,
        },
      },
    },
  })

  return NumberFieldSchema
}
export default createNumberFieldSchema
