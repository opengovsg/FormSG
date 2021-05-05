import { Schema } from 'mongoose'

import { ISectionFieldSchema } from '@root/types'

const createSectionFieldSchema = () => new Schema<ISectionFieldSchema>()

export default createSectionFieldSchema
