import { FieldResponse } from '../form'

export type EncryptSubmissionDto = {
  responses: FieldResponse[]
  encryptedContent: string
  attachments?: EncryptedAttachmentsDto
  isPreview: boolean
  version: number
}

export type EncryptedAttachmentsDto = {
  [fieldId: string]: {
    encryptedFile:
      | {
          binary: string
          nonce: string
          submissionPublicKey: string
        }
      | undefined
  }
}
