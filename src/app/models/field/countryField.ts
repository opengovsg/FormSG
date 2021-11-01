import { Schema } from 'mongoose'

import { ICountryFieldSchema } from '../../../types'

const createCountryFieldSchema = () => {
  return new Schema<ICountryFieldSchema>({
    fieldOptions: [String],
  })
}

export default createCountryFieldSchema
