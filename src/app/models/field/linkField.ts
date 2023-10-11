import { Schema } from 'mongoose'

import { ILinkFieldSchema } from '../../../types'

const createLinkFieldSchema = () =>
  new Schema<ILinkFieldSchema>({
    url: {
      type: String,
      trim: true,
      required: true,
    },
  })

export default createLinkFieldSchema
