import { Schema } from 'mongoose'

import { IYesNoFieldSchema } from '@root/types'

const createYesNoFieldSchema = () => new Schema<IYesNoFieldSchema>()

export default createYesNoFieldSchema
