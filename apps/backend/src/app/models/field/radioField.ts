import { Schema } from 'mongoose'

import { Language } from '../../../../shared/types'
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
