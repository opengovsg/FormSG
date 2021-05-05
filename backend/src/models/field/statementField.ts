import { Schema } from 'mongoose'

import { IStatementFieldSchema } from 'src/types'

const createStatementFieldSchema = () => new Schema<IStatementFieldSchema>()

export default createStatementFieldSchema
