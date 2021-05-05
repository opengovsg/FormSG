import { Schema } from 'mongoose'

import { IDropdownFieldSchema } from '@root/types'

import { MyInfoSchema } from './baseField'

const createDropdownFieldSchema = () => {
  return new Schema<IDropdownFieldSchema>({
    fieldOptions: [String],
    myInfo: MyInfoSchema,
  })
}
export default createDropdownFieldSchema
