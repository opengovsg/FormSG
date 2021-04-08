import { FieldResponse } from 'src/types'

import { ProcessedFieldResponse } from '../submission.types'

export type EncryptSubmissionBody = {
  responses: FieldResponse[]
  encryptedContent: string
  attachments?: {
    encryptedFile?: {
      binary: string
      nonce: string
      submissionPublicKey: string
    }
  }
  isPreview: boolean
  version: number
}

type Attachments = {
  encryptedFile?: {
    binary: string
    nonce: string
    submissionPublicKey: string
  }
}
export type EncryptSubmissionBodyAfterProcess = {
  encryptedContent: string
  attachments?: Attachments
  isPreview: boolean
  version: number
  parsedResponses: ProcessedFieldResponse[]
}

export type WithAttachmentsData<T> = T & { attachmentData: Attachments }

export type WithFormData<T> = T & { formData: string }

export type AttachmentMetadata = Map<string, string>
