import { WorkflowEventBase } from 'formsg-shared/types'
import type { Merge } from 'type-fest'

import { IUserSchema } from './user'

/**
 * An admin action on a multirespondent workflow, stored in the submission's
 * `workflowEvents`.
 */
export type IWorkflowEvent = Merge<
  WorkflowEventBase,
  {
    actorId: IUserSchema['_id']
    created: Date
  }
>
