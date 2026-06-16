import {
  FieldResponsesV3,
  FormFieldDto,
  FormLogic,
  FormResponseMode,
  ResponseMetadata,
  SubmissionAttachmentsMap,
} from 'formsg-shared/types'

import { IPopulatedMultirespondentForm } from '../form'
import { IMultirespondentSubmissionSchema } from '../submission'
import { FormKeyContentCopy } from '../submission_history'

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
  | 'admin'
  | 'webhook'
  | 'title'
  | 'workflow'
  | 'hasStatusTracker'
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
  hashedSubmitterId?: string
  submitterId?: string
  responses: FieldResponsesV3
  mrfVersion: number
  /**
   * Form-key copy of the step content (M5), present only when this step writes
   * a submission_history snapshot (V4 + webhook URL + retries enabled). Carried
   * from the middleware (where the plaintext exists) to the service, which
   * assembles the full snapshot at save time.
   */
  formKeyContentCopy?: FormKeyContentCopy
}
