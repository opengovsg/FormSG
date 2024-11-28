import { Schema } from 'mongoose'

import { IDropdownFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createDropdownFieldSchema = () => {
  return new Schema<IDropdownFieldSchema>({
    fieldOptions: [String],
    optionsToRecipientsMap: { type: Object, of: [String] },
    myInfo: MyInfoSchema,
  })
}
export default createDropdownFieldSchema
