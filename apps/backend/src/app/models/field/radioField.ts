import { Language } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { IRadioFieldSchema } from '../../../types'

const createRadioFieldSchema = () => {
  return new Schema<IRadioFieldSchema>({
    fieldOptions: [String],
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
  })
}
export default createRadioFieldSchema
