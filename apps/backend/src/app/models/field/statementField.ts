import { Schema } from 'mongoose'

import { IStatementFieldSchema } from '../../../types'

const createStatementFieldSchema = () => new Schema<IStatementFieldSchema>()

export default createStatementFieldSchema
