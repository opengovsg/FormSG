import { Schema } from 'mongoose'

import { DateSelectedValidation, DaysOfTheWeek } from '../../../../shared/types'
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
    invalidDaysOfTheWeek: {
      type: [Number],
      enum: [...Object.values(DaysOfTheWeek)],
    },
  })
}

export default createDateFieldSchema
