import { Schema } from 'mongoose'

import { IBookingFieldSchema } from '../../../types'

const createBookingFieldSchema = () => {
  return new Schema<IBookingFieldSchema>({
    eventCode: String,
  })
}
export default createBookingFieldSchema
