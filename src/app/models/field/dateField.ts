import { Schema } from 'mongoose'

import {
  DateSelectedValidation,
  ValidDaysOptions,
} from '../../../../shared/types'
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
    validDays: {
      type: [
        {
          type: String,
          required: true,
        },
      ],
      enum: [...Object.values(ValidDaysOptions)],
      default: Object.values(ValidDaysOptions),
    },
  })
}

export default createDateFieldSchema
