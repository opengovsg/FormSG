import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import {
  FormFieldDto,
  FormLogic,
  FormResponseMode,
  PaymentFieldsDto,
  ProductItem,
  ResponseMetadata,
  SubmissionAttachmentsMap,
} from 'formsg-shared/types'

import { IPopulatedMultirespondentForm } from '../form'
import { IMultirespondentSubmissionSchema } from '../submission'

export type ParsedMultirespondentSubmissionBody = {
  responses: FieldResponsesV4
  responseMetadata?: ResponseMetadata
  version: number
  workflowStep: number
  respondentEmails?: string[]
  paymentReceiptEmail?: string
  paymentProducts?: Array<ProductItem>
  payments?: PaymentFieldsDto
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
  responses: FieldResponsesV4
  mrfVersion: number
  stepToken?: string
  stepTokenHash?: string
  encryptedStepToken?: string
  paymentReceiptEmail?: string
  paymentProducts?: Array<ProductItem>
  payments?: PaymentFieldsDto
}
