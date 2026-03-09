import { AttachmentSize } from 'formsg-shared/types'
import { Schema } from 'mongoose'

import { IAttachmentFieldSchema } from '../../../types/field'

const createAttachmentFieldSchema = () => {
  const AttachmentFieldSchema = new Schema<IAttachmentFieldSchema>({
    attachmentSize: {
      type: String,
      required: true,
      enum: Object.values(AttachmentSize),
    },
  })

  return AttachmentFieldSchema
}

export default createAttachmentFieldSchema
