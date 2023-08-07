import { Schema } from 'mongoose'

import {
  NumberSelectedValidation,
  NumberValidationOptions,
} from '../../../../shared/types'
import { INumberFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createNumberFieldSchema = () => {
  const ValidationOptionsSchema = new Schema<NumberValidationOptions>({
    customVal: {
      type: Number,
    },
    selectedValidation: {
      type: String,
      enum: [...Object.values(NumberSelectedValidation), null],
    },
  })

  const NumberFieldSchema = new Schema<INumberFieldSchema>({
    myInfo: MyInfoSchema,
    ValidationOptions: {
      type: ValidationOptionsSchema,
      default: {
        // Defaults are defined here because subdocument paths are undefined by default, and Mongoose does not apply subdocument defaults unless you set the subdocument path to a non-nullish value (see https://mongoosejs.com/docs/subdocs.html)
        customVal: null,
        selectedValidation: null,
      },
    },
  })

  return NumberFieldSchema
}
export default createNumberFieldSchema
