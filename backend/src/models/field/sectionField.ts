import { Schema } from 'mongoose'

import { ISectionFieldSchema } from 'src/types'

const createSectionFieldSchema = () => new Schema<ISectionFieldSchema>()

export default createSectionFieldSchema
