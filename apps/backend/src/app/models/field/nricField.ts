import { CorppassAttribute, MyInfoAttribute } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { INricFieldSchema } from '../../../types'

import { createAttrSourceSchema } from './baseField'

const createNricFieldSchema = () =>
  new Schema<INricFieldSchema>({
    myInfo: createAttrSourceSchema([MyInfoAttribute.UinFin]),
    corppass: createAttrSourceSchema([CorppassAttribute.Uid]),
  })

export default createNricFieldSchema
