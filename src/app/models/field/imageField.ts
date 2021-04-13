import { Schema } from 'mongoose'
import validator from 'validator'

import { IImageFieldSchema } from '../../../types'
import { isDev } from '../../config/config'

const createImageFieldSchema = () => {
  return new Schema<IImageFieldSchema>({
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (url: string) {
          return validator.isURL(url, {
            allow_underscores: true,
            // Not require top level domain (i.e. com) for development
            // environment where s3 is hosted on localhost.
            require_tld: !isDev,
          })
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
