import { WorkflowEventType } from 'formsg-shared/types'
import { Mongoose, Schema } from 'mongoose'

import { IWorkflowEventModel, IWorkflowEventSchema } from '../../types'

import { FORM_SCHEMA_ID } from './form.server.model'
import { SUBMISSION_SCHEMA_ID } from './submission.server.model'
import { USER_SCHEMA_ID } from './user.server.model'

export const WORKFLOW_EVENT_SCHEMA_ID = 'WorkflowEvent'
export const WORKFLOW_EVENT_COLLECTION_NAME = 'workflow_events'

const WorkflowEventSchema = new Schema<
  IWorkflowEventSchema,
  IWorkflowEventModel
>(
  {
    type: {
      type: String,
      enum: Object.values(WorkflowEventType),
      required: true,
    },
    formId: {
      type: Schema.Types.ObjectId,
      ref: FORM_SCHEMA_ID,
      required: true,
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: SUBMISSION_SCHEMA_ID,
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: USER_SCHEMA_ID,
      required: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    stepNumber: {
      type: Number,
      min: 1,
      required: true,
    },
    emails: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: false,
    },
  },
)

WorkflowEventSchema.index({ submissionId: 1, created: 1 })

const getWorkflowEventModel = (db: Mongoose): IWorkflowEventModel => {
  try {
    return db.model<IWorkflowEventSchema, IWorkflowEventModel>(
      WORKFLOW_EVENT_SCHEMA_ID,
    )
  } catch {
    return db.model<IWorkflowEventSchema, IWorkflowEventModel>(
      WORKFLOW_EVENT_SCHEMA_ID,
      WorkflowEventSchema,
      WORKFLOW_EVENT_COLLECTION_NAME,
    )
  }
}

export default getWorkflowEventModel
