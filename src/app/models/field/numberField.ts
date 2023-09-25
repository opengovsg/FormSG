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
      default: null,
      enum: [...Object.values(NumberSelectedValidation), null],
    },
    LengthValidationOptions: {
      customVal: {
        type: Number,
        default: null,
        required: [
          function requireSelectedLengthValidation(
            this: NumberValidationOptions,
          ) {
            return (
              this.LengthValidationOptions.selectedLengthValidation !== null
            )
          },
          'Please enter a customVal',
        ],
      },
      selectedLengthValidation: {
        type: String,
        default: null,
        enum: [...Object.values(NumberSelectedLengthValidation), null],
        required: [
          function hasSelectedValidation(this: NumberValidationOptions) {
            return this.selectedValidation === NumberSelectedValidation.Length
          },
          'Please select the type of length validation',
        ],
      },
    },
    RangeValidationOptions: {
      customMin: {
        type: Number,
        default: null,
        validate: {
          validator: function hasValidRange(this: NumberValidationOptions) {
            if (this.selectedValidation !== NumberSelectedValidation.Range) {
              return true
            }

            const { customMin, customMax } = this.RangeValidationOptions
            const hasRange = customMin !== null || customMax !== null
            const isValidRange =
              customMin === null || customMax === null || customMin < customMax
            return hasRange && isValidRange
          },
          message: 'Please enter a valid range',
        },
      },
      customMax: {
        type: Number,
        default: null,
      },
    },
  })

  const NumberFieldSchema = new Schema<INumberFieldSchema>({
    myInfo: MyInfoSchema,
    ValidationOptions: {
      type: ValidationOptionsSchema,
      // Setting the subdocument path to an empty object ensures the defaults in ValidationOptionsSchema are applied.
      // See: https://mongoosejs.com/docs/subdocs.html#subdocument-defaults
      default: () => ({}),
    },
  })

  return NumberFieldSchema
}
export default createNumberFieldSchema
