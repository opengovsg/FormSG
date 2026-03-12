import { Schema } from 'mongoose'

import { IYesNoFieldSchema } from '../../../types'

const createYesNoFieldSchema = () => new Schema<IYesNoFieldSchema>()

export default createYesNoFieldSchema
