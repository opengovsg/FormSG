import { AttachmentSize } from 'formsg-shared/types'
import { VALID_EXTENSIONS } from 'formsg-shared/utils/file-validation'
import { Schema } from 'mongoose'

import { IAttachmentFieldSchema } from '../../../types/field'

const createAttachmentFieldSchema = () => {
  const AttachmentFieldSchema = new Schema<IAttachmentFieldSchema>({
    attachmentSize: {
      type: String,
      required: true,
      enum: Object.values(AttachmentSize),
    },
    // PROTOTYPE (attachments-v2): stored so the builder settings survive a
    // save. Submissions don't enforce them yet.
    allowedFileTypes: {
      type: [{ type: String, enum: VALID_EXTENSIONS }],
      // No empty array on fields that were never restricted.
      default: undefined,
    },
    allowMultipleAttachments: {
      type: Boolean,
    },
  })

  return AttachmentFieldSchema
}

export default createAttachmentFieldSchema
