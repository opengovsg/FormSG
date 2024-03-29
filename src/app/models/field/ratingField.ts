import { Schema } from 'mongoose'

import { RatingShape } from '../../../../shared/types'
import { IRatingFieldSchema } from '../../../types'

const createRatingFieldSchema = () => {
  return new Schema<IRatingFieldSchema>({
    ratingOptions: {
      steps: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
      },
      shape: {
        type: String,
        enum: Object.values(RatingShape),
        default: RatingShape.Heart,
      },
    },
  })
}
export default createRatingFieldSchema
