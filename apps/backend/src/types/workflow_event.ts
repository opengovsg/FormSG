import { WorkflowEventBase } from 'formsg-shared/types'
import type { Merge } from 'type-fest'

import { IUserSchema } from './user'

/**
 * A submission's encrypted answers, with the keys and metadata needed to
 * decrypt them, as stored on the submission itself.
 */
export type WorkflowEventPreviousContent = {
  encryptedContent: string
  encryptedSubmissionSecretKey: string
  submissionPublicKey: string
  verifiedContent?: string
  attachmentMetadata?: Record<string, string>
  version: number
}

/**
 * An admin action on a multirespondent workflow, stored in the submission's
 * `workflowEvents`.
 */
export type IWorkflowEvent = Merge<
  WorkflowEventBase,
  {
    actorId: IUserSchema['_id']
    created: Date
    /**
     * Send back only: the answers as they were before the send back, since
     * resubmitting the undone steps overwrites them. Not sent to admins yet.
     */
    previousContent?: WorkflowEventPreviousContent
  }
>
