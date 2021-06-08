import { Schema } from 'mongoose'

import {
  IShortTextFieldSchema,
  ShortTextValidationOptions,
} from '../../../types'
import { TextSelectedValidation } from '../../../types/field/baseField'
import { WithCustomMinMax } from '../../../types/field/utils/virtuals'

import { MyInfoSchema } from './baseField'

const createShortTextFieldSchema = () => {
  const ValidationOptionsSchema = new Schema<
    WithCustomMinMax<ShortTextValidationOptions>
  >(
    {
      customVal: {
        type: Number,
      },
      selectedValidation: {
        type: String,
        enum: [...Object.values(TextSelectedValidation), null],
      },
    },
    {
      // TODO: Remove virtuals (#2039)
      toJSON: {
        virtuals: true,
      },
    },
  )

  // Virtuals to allow for backwards compatibility after customMin and customMax were removed as part of #408
  // TODO: Remove virtuals (#2039)
  ValidationOptionsSchema.virtual('customMin').get(function (
    this: WithCustomMinMax<ShortTextValidationOptions>,
  ) {
    return this.customVal
  })

  ValidationOptionsSchema.virtual('customMax').get(function (
    this: WithCustomMinMax<ShortTextValidationOptions>,
  ) {
    return this.customVal
  })

  const ShortTextFieldSchema = new Schema<IShortTextFieldSchema>({
    myInfo: MyInfoSchema,
    ValidationOptions: {
      type: ValidationOptionsSchema,
      default: {
        // Defaults are defined here because subdocument paths are undefined by default, and Mongoose does not apply subdocument defaults unless you set the subdocument path to a non-nullish value (see https://mongoosejs.com/docs/subdocs.html)
        customVal: null,
        selectedValidation: null,
      },
    },
    allowPrefill: {
      // flag to restrict prefill only to pre-approved form fields
      type: Boolean,
      default: false,
    },
  })

  return ShortTextFieldSchema
}

export default createShortTextFieldSchema
