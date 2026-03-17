import { Schema } from 'mongoose'

import { ISectionFieldSchema } from '../../../types'

const createSectionFieldSchema = () => new Schema<ISectionFieldSchema>()

export default createSectionFieldSchema
