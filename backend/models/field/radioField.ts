import { Schema } from 'mongoose'

import { IRadioFieldSchema } from '../../../types'

const createRadioFieldSchema = () => {
  return new Schema<IRadioFieldSchema>({
    fieldOptions: [String],
    othersRadioButton: {
      type: Boolean,
      default: false,
    },
  })
}
export default createRadioFieldSchema
