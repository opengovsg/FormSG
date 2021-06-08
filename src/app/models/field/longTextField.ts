import { Schema } from 'mongoose'

import { ILongTextFieldSchema, LongTextValidationOptions } from '../../../types'
import { TextSelectedValidation } from '../../../types/field/baseField'
import { WithCustomMinMax } from '../../../types/field/utils/virtuals'

const createLongTextFieldSchema = () => {
  const ValidationOptionsSchema = new Schema<
    WithCustomMinMax<LongTextValidationOptions>
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
      toJSON: {
        virtuals: true,
      },
    },
  )

  // Virtuals to allow for backwards compatibility after customMin and customMax were removed as part of #408
  // TODO: Remove virtuals (#2039)
  ValidationOptionsSchema.virtual('customMin').get(function (
    this: WithCustomMinMax<LongTextValidationOptions>,
  ) {
    return this.customVal
  })

  ValidationOptionsSchema.virtual('customMax').get(function (
    this: WithCustomMinMax<LongTextValidationOptions>,
  ) {
    return this.customVal
  })

  const LongTextFieldSchema = new Schema<ILongTextFieldSchema>({
    ValidationOptions: {
      type: ValidationOptionsSchema,
      default: {
        // Defaults are defined here because subdocument paths are undefined by default, and Mongoose does not apply subdocument defaults unless you set the subdocument path to a non-nullish value (see https://mongoosejs.com/docs/subdocs.html)
        customVal: null,
        selectedValidation: null,
      },
    },
  })

  return LongTextFieldSchema
}
export default createLongTextFieldSchema
