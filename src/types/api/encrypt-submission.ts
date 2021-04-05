import { FieldResponse } from '../response'

export type EncryptSubmissionBody = {
  responses: FieldResponse[]
  encryptedContent: string
  attachments?: EncryptedAttachments
  isPreview: boolean
  version: number
}

export type EncryptedAttachments = {
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
