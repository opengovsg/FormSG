import { Schema } from 'mongoose'

import { IAddressFieldSchema } from 'src/types'

const createAddressFieldSchema = () => {
  return new Schema<IAddressFieldSchema>({})
}

export default createAddressFieldSchema
