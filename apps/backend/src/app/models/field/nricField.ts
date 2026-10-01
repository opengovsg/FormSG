import { MyInfoAttribute } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { INricFieldSchema } from '../../../types'

import { createAttrSourceSchema } from './baseField'

const createNricFieldSchema = () =>
  new Schema<INricFieldSchema>({
    myInfo: {
      type: createAttrSourceSchema([MyInfoAttribute.UinFin]),
      default: undefined,
    },
  })

export default createNricFieldSchema
