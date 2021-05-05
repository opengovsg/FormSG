import { Schema } from 'mongoose'

import { IHomenoFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createHomenoFieldSchema = () => {
  return new Schema<IHomenoFieldSchema>({
    myInfo: MyInfoSchema,
    allowIntlNumbers: {
      type: Boolean,
      default: false,
    },
  })
}
export default createHomenoFieldSchema
