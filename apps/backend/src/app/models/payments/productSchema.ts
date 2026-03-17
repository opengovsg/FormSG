import { Product } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { isPositiveInteger } from '../utils'

export const ProductSchema = new Schema<Product>({
  name: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  multi_qty: {
    type: Boolean,
    default: false,
  },
  min_qty: {
    type: Number,
    required: false,
    validator: isPositiveInteger,
  },
  max_qty: {
    type: Number,
    required: false,
    validator: isPositiveInteger,
  },
  amount_cents: {
    type: Number,
    default: 0,
    validate: {
      validator: isPositiveInteger,
      message: 'amount_cents must be a non-negative integer.',
    },
  },
})
