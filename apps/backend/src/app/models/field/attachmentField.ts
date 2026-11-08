import { AttachmentSize, FormResponseMode } from 'formsg-shared/types'
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
  })

  return AttachmentFieldSchema
}

export default createAttachmentFieldSchema
