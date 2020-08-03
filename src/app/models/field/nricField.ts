import { Schema } from 'mongoose'

import { INricFieldSchema } from '../../../types'

const createNricFieldSchema = () => new Schema<INricFieldSchema>()

export default createNricFieldSchema
