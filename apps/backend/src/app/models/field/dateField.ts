import { DateSelectedValidation, InvalidDaysOptions } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { IDateFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createDateFieldSchema = () => {
  return new Schema<IDateFieldSchema>({
    myInfo: MyInfoSchema,
    dateValidation: {
      customMinDate: {
        type: Date,
        default: null,
      },
      customMaxDate: {
        type: Date,
        default: null,
      },
      selectedDateValidation: {
        type: String,
        enum: [...Object.values(DateSelectedValidation), null],
        default: null,
      },
    },
    invalidDays: {
      type: [
        {
          type: String,
          required: true,
        },
      ],
      enum: [...Object.values(InvalidDaysOptions)],
    },
  })
}

export default createDateFieldSchema
