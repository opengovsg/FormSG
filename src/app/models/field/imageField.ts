import { escapeRegExp } from 'lodash'
import { Schema } from 'mongoose'

import { IImageFieldSchema } from '../../../types'
import { aws } from '../../config/config'

const createImageFieldSchema = () => {
  return new Schema<IImageFieldSchema>({
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (url: string) {
          return url.match(`^${escapeRegExp(aws.imageBucketUrl)}/`) !== null
        },
        message: `Please ensure that your url is in the valid format`,
      },
    },
    fileMd5Hash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
  })
}
export default createImageFieldSchema
