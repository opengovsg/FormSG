import { Schema } from 'mongoose'

import { IShortTextFieldSchema } from '../../../types'

import { TextValidationOptionsSchema } from './util/textValidationOptionsSchema'
import { MyInfoSchema } from './baseField'

const createShortTextFieldSchema = () => {
  const ShortTextFieldSchema = new Schema<IShortTextFieldSchema>({
    myInfo: MyInfoSchema,
    ValidationOptions: {
      type: TextValidationOptionsSchema,
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
