import { Schema } from 'mongoose'

import { INricFieldSchema } from 'src/types'

const createNricFieldSchema = () => new Schema<INricFieldSchema>()

export default createNricFieldSchema
