import { IPopulatedEncryptedForm } from '../../../../types'
import { StorageModeAttachmentsMap } from '../../../../types/api'
import { ProcessedFieldResponse } from '../submission.types'

export type EncryptSubmissionBodyAfterProcess = {
  encryptedContent: string
  attachments?: StorageModeAttachmentsMap
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
