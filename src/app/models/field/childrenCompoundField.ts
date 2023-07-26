import { Schema } from 'mongoose'

import { IChildrenCompoundFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createchildrenCompoundFieldSchema = () => {
  return new Schema<IChildrenCompoundFieldSchema>({
    childrenSubFields: [String],
    allowMultiple: Boolean,
    myInfo: MyInfoSchema,
  })
}
export default createchildrenCompoundFieldSchema
