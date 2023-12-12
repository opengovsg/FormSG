import {
  FieldResponsesV3,
  FormResponseMode,
  ResponseMetadata,
} from '../../../shared/types'
import { IPopulatedMultirespondentForm } from '../form'

export type ParsedMultirespondentSubmissionBody = {
  responses: FieldResponsesV3
  responseMetadata?: ResponseMetadata
  version: number
}

export type MultirespondentFormLoadedDto = {
  responseMode: FormResponseMode.Multirespondent
  formDef: IPopulatedMultirespondentForm
  featureFlags: string[]
}

export type MultirespondentFormCompleteDto = MultirespondentFormLoadedDto & {
  encryptedPayload: MultirespondentSubmissionDto
}

export type MultirespondentSubmissionDto = {
  // responses: Pick<
  //   EmailResponse | MobileResponse,
  //   'fieldType' | '_id' | 'answer' | 'signature'
  // >[]
  submissionPublicKey: string
  encryptedSubmissionSecretKey: string
  encryptedContent: string
  // attachments?: SubmissionAttachmentsMap
  version: number
  responseMetadata?: ResponseMetadata
}
