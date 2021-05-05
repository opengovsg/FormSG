import { Schema } from 'mongoose'

import { IYesNoFieldSchema } from 'src/types'

const createYesNoFieldSchema = () => new Schema<IYesNoFieldSchema>()

export default createYesNoFieldSchema
