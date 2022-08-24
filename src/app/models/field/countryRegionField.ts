import { Schema } from 'mongoose'

import { ICountryRegionFieldSchema } from '../../../types'

const createCountryRegionFieldSchema = () => {
  return new Schema<ICountryRegionFieldSchema>({})
}

export default createCountryRegionFieldSchema
