import { Schema } from 'mongoose'

import { INricFieldSchema } from '@root/types'

const createNricFieldSchema = () => new Schema<INricFieldSchema>()

export default createNricFieldSchema
