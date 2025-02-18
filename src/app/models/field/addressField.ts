import { Schema } from 'mongoose'

import { IAddressCompoundFieldSchema } from 'src/types'

const createAddressCompoundFieldSchema = () => {
  return new Schema<IAddressCompoundFieldSchema>({})
}

export default createAddressCompoundFieldSchema
