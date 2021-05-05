import { Document, Schema } from 'mongoose'

import {
  AttachmentSize,
  IAttachmentField,
  IFormSchema,
  ResponseMode,
} from '@root/types'

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

  // Prevent attachments from being saved on a webhooked form.
  AttachmentFieldSchema.pre<IAttachmentFieldSchema>(
    'validate',
    function (next) {
      const { webhook, responseMode } = this.parent()

      if (responseMode === ResponseMode.Encrypt && webhook?.url) {
        return next(
          Error('Attachments are not allowed when a form has a webhook url'),
        )
      }

      return next()
    },
  )

  return AttachmentFieldSchema
}

export default createAttachmentFieldSchema
