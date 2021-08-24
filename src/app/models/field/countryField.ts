import { Schema } from 'mongoose'

import { IDropdownFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createCountryFieldSchema = () => {
  return new Schema<IDropdownFieldSchema>({
    fieldOptions: [String],
    myInfo: MyInfoSchema,
  })
}
export default createCountryFieldSchema
