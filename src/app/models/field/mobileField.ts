import { Schema } from 'mongoose'

import { IMobileFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createMobileFieldSchema = () => {
  return new Schema<IMobileFieldSchema>({
    myInfo: MyInfoSchema,
    allowIntlNumbers: {
      type: Boolean,
      default: false,
    },
    isVerifiable: {
      type: Boolean,
      default: false,
    },
  })
}
export default createMobileFieldSchema
