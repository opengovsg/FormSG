import { Document, Schema } from 'mongoose'

import { AttachmentSize, IAttachmentField, IFormSchema } from '../../../types'

// Manual override since mongoose types don't have generics yet.
interface IAttachmentFieldSchema extends IAttachmentField, Document {
  /** Returns the top level document of this sub-document. */
  ownerDocument(): IFormSchema
  /** Returns this sub-documents parent document. */
  parent(): IFormSchema
}

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
