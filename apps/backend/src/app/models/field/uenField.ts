import { Schema } from 'mongoose'

import { IUenFieldSchema } from '../../../types'

const createUenFieldSchema = () => new Schema<IUenFieldSchema>()

export default createUenFieldSchema
