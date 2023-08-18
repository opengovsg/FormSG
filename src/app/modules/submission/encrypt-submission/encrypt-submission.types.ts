import { IPopulatedEncryptedForm } from '../../../../types'

export type AttachmentMetadata = Map<string, string>

export type SaveEncryptSubmissionParams = {
  form: IPopulatedEncryptedForm
  encryptedContent: string
  version: number
  verifiedContent?: string
  attachmentMetadata?: Map<string, string>
}
