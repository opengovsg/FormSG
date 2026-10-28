import {
  AdminWorkflowEventBase,
  StepSubmittedEventBase,
} from 'formsg-shared/types'

import { IUserSchema } from './user'

export type IAdminWorkflowEvent = AdminWorkflowEventBase & {
  actorId: IUserSchema['_id']
  created: Date
}

export type StepSubmittedContent = {
  encryptedContent: string
  encryptedSubmissionSecretKey: string
  submissionPublicKey: string
  verifiedContent?: string
  attachmentMetadata?: Map<string, string>
  version: number
}

export type IStepSubmittedEvent = StepSubmittedEventBase & {
  created: Date
  content?: StepSubmittedContent
}

export type IWorkflowEvent = IAdminWorkflowEvent | IStepSubmittedEvent
