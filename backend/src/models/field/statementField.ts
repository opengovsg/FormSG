import { Schema } from 'mongoose'

import { IStatementFieldSchema } from '@root/types'

const createStatementFieldSchema = () => new Schema<IStatementFieldSchema>()

export default createStatementFieldSchema
