import { EncryptedAttachments } from '../../../../types/api'
import { ProcessedFieldResponse } from '../submission.types'

export type EncryptSubmissionBodyAfterProcess = {
  encryptedContent: string
  attachments?: EncryptedAttachments
  isPreview: boolean
  version: number
  parsedResponses: ProcessedFieldResponse[]
}

export type WithAttachmentsData<T> = T & {
  attachmentData: EncryptedAttachments
}

export type WithFormData<T> = T & { formData: string }

export type AttachmentMetadata = Map<string, string>
