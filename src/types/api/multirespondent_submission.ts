import {
  FieldResponsesV3,
  FormFieldDto,
  FormLogic,
  FormResponseMode,
  ResponseMetadata,
  SubmissionAttachmentsMap,
} from '../../../shared/types'
import { IPopulatedMultirespondentForm } from '../form'
import { IMultirespondentSubmissionSchema } from '../submission'

export type ParsedMultirespondentSubmissionBody = {
  responses: FieldResponsesV3
  responseMetadata?: ResponseMetadata
  version: number
  workflowStep: number
  respondentEmails?: string[]
}

export type SnapshottedFormDef = Pick<
  IPopulatedMultirespondentForm,
  | 'emails'
  | 'stepOneEmailNotificationFieldId'
  | 'stepsToNotify'
  | 'hasRespondentCopy'
  | 'webhook'
  | 'title'
  | 'workflow'
> & {
  _id: string
  form_fields: FormFieldDto[]
  form_logics: FormLogic[]
}

export type MultirespondentFormLoadedDto = {
  responseMode: FormResponseMode.Multirespondent
  formDef: IPopulatedMultirespondentForm
  snapshottedFormDef?: SnapshottedFormDef
  mrfSubmission?: IMultirespondentSubmissionSchema
  featureFlags: string[]
  respondentEmails?: string[]
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
  verifiedContent?: string
  submissionSecretKey: string
  attachments?: SubmissionAttachmentsMap
  version: number
  responseMetadata?: ResponseMetadata
  workflowStep: number
  responses: FieldResponsesV3
  mrfVersion: number
}
