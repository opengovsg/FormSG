import { Schema } from 'mongoose'

import { ILongTextFieldSchema } from '../../../types'

import { TextValidationOptionsSchema } from './common/textValidationOptionsSchema'

const createLongTextFieldSchema = () => {
  const LongTextFieldSchema = new Schema<ILongTextFieldSchema>({
    ValidationOptions: {
      type: TextValidationOptionsSchema,
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
