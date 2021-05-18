import { FieldResponse } from '../response'

export type EncryptSubmissionDto = {
  responses: FieldResponse[]
  encryptedContent: string
  attachments?: EncryptedAttachmentsDto
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
