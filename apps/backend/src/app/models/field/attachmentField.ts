import { AttachmentSize, FormResponseMode } from 'formsg-shared/types'
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
    allowMultiple: {
      type: Boolean,
      default: false,
      validate: {
        validator: function (
          this: IAttachmentFieldSchema,
          allowMultiple: boolean,
        ) {
          return (
            !allowMultiple ||
            this.ownerDocument().responseMode !== FormResponseMode.Email
          )
        },
        message: 'Email mode forms do not support multiple attachments',
      },
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
