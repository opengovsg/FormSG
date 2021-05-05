import { IPopulatedEncryptedForm } from '@root/types'
import { EncryptedAttachmentsDto } from '../../../../../shared/types/api'
import { ProcessedFieldResponse } from '../submission.types'

export type EncryptSubmissionBodyAfterProcess = {
  encryptedContent: string
  attachments?: EncryptedAttachmentsDto
  isPreview: boolean
  version: number
  parsedResponses: ProcessedFieldResponse[]
}

export type AttachmentMetadata = Map<string, string>

export type SaveEncryptSubmissionParams = {
  form: IPopulatedEncryptedForm
  encryptedContent: string
  version: number
  verifiedContent?: string
  attachmentMetadata?: Map<string, string>
}
