import { AttachmentSize } from 'formsg-shared/types'
import { validateAllowedFileTypes } from 'formsg-shared/utils/file-validation'
import { Schema } from 'mongoose'

import { IAttachmentFieldSchema } from '../../../types/field'

const createAttachmentFieldSchema = () => {
  const AttachmentFieldSchema = new Schema<IAttachmentFieldSchema>({
    attachmentSize: {
      type: String,
      required: true,
      enum: Object.values(AttachmentSize),
    },
    allowedFileTypes: {
      type: [String],
      default: undefined,
      validate: {
        validator: validateAllowedFileTypes,
        message: 'There are one or more duplicate or invalid file types.',
      },
    },
  })

  return AttachmentFieldSchema
}

export default createAttachmentFieldSchema
