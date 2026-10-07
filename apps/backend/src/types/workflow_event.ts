import { WorkflowEventBase } from 'formsg-shared/types'
import { Document, Model } from 'mongoose'
import type { Merge } from 'type-fest'

import { IFormSchema } from './form'
import { ISubmissionSchema } from './submission'
import { IUserSchema } from './user'

export type IWorkflowEvent = Merge<
  WorkflowEventBase,
  {
    formId: IFormSchema['_id']
    submissionId: ISubmissionSchema['_id']
    actorId: IUserSchema['_id']
  }
>

export interface IWorkflowEventSchema extends IWorkflowEvent, Document {
  created?: Date
}

export interface IWorkflowEventDocument extends IWorkflowEventSchema {
  created: Date
}

export type IWorkflowEventModel = Model<IWorkflowEventSchema>
