import {
  FieldResponsesV3,
  FormResponseMode,
  ResponseMetadata,
  SubmissionAttachmentsMap,
} from '../../../shared/types'
import { IPopulatedMultirespondentForm } from '../form'

export type ParsedMultirespondentSubmissionBody = {
  responses: FieldResponsesV3
  responseMetadata?: ResponseMetadata
  version: number
  workflowStep: number
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
  submissionSecretKey: string
  attachments?: SubmissionAttachmentsMap
  version: number
  responseMetadata?: ResponseMetadata
  workflowStep: number
  responses: FieldResponsesV3
  mrfVersion: number
}
