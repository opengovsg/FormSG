import { Schema } from 'mongoose'
import Country from 'shared/constants/countries'

import { ICountryFieldSchema } from '../../../types'

const createCountryFieldSchema = () => {
  return new Schema<ICountryFieldSchema>({
    fieldOptions: [Country],
  })
}

export default createCountryFieldSchema
