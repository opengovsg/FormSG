import { CorppassAttribute } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { IShortTextFieldSchema } from '../../../types'

import { TextValidationOptionsSchema } from './common/textValidationOptionsSchema'
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
    lockPrefill: {
      type: Boolean,
      default: false,
      required: false,
    },
  })

  // A Corppass UID is filled from the login and may be a foreign identifier,
  // so text constraints could reject it and URL prefill could replace it.
  ShortTextFieldSchema.pre<IShortTextFieldSchema>('validate', function (next) {
    if (this.corppass?.attr !== CorppassAttribute.Uid) return next()

    const { customVal, selectedValidation } = this.ValidationOptions ?? {}
    if (
      customVal != null ||
      selectedValidation != null ||
      this.allowPrefill ||
      this.lockPrefill
    ) {
      this.invalidate(
        'corppass',
        'The Corppass UID source does not allow text validation or prefill',
      )
    }
    return next()
  })

  return ShortTextFieldSchema
}

export default createShortTextFieldSchema
