import { Schema } from 'mongoose'

import { IChildrenCompoundFieldSchema } from '../../../types'

import { MyInfoSchema } from './baseField'

const createchildrenCompoundFieldSchema = () => {
  return new Schema<IChildrenCompoundFieldSchema>({
    childrenSubFields: [String],
    allowMultiple: Boolean,
    // Children schema version (ADR-0001). 2 = v2 (answerObject v4 behaviour);
    // absent/1 = legacy. Without this path, strict mode drops the v2 stamp on
    // save and ignores it on read.
    version: Number,
    myInfo: MyInfoSchema,
  })
}
export default createchildrenCompoundFieldSchema
