import { Schema } from 'mongoose'

import { Language } from '../../../../shared/types'
import { IDropdownFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createDropdownFieldSchema = () => {
  return new Schema<IDropdownFieldSchema>({
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
    myInfo: MyInfoSchema,
  })
}
export default createDropdownFieldSchema
