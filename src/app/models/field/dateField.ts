import { Schema } from 'mongoose'

import { DateSelectedValidation, IDateFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createDateFieldSchema = () => {
  return new Schema<IDateFieldSchema>({
    myInfo: MyInfoSchema,

    // TODO((#2437): Remove isFutureOnly key after 31 Aug 2020
    isFutureOnly: {
      type: Boolean,
      default: false,
    },

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
        enum: Object.values(DateSelectedValidation).concat([null]),
        default: null,
      },
    },
  })
}

export default createDateFieldSchema
