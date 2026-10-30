import {
  WorkflowEventBase,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'
import type { Merge } from 'type-fest'

import { IUserSchema } from './user'

/**
 * An admin action on a multirespondent workflow, stored in the submission's
 * `workflowEvents`.
 */
export type IAdminWorkflowEvent = Merge<
  WorkflowEventBase,
  {
    actorId: IUserSchema['_id']
    created: Date
  }
>

export type IStepSubmittedEvent = {
  type: WorkflowEventType.StepSubmitted
  stepNumber: number
  outcome: Exclude<WorkflowStatus, WorkflowStatus.PENDING>
  emails: string[]
  created: Date
  snapshotKey: string
}

export type IWorkflowEvent = IAdminWorkflowEvent | IStepSubmittedEvent
