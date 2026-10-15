import { CorppassAttribute } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { IUenFieldSchema } from '../../../types'

import { createAttrSourceSchema } from './baseField'

const createUenFieldSchema = () =>
  new Schema<IUenFieldSchema>({
    corppass: createAttrSourceSchema([CorppassAttribute.Uen]),
  })

export default createUenFieldSchema
