import { Schema } from 'mongoose'
import validator from 'validator'

import { WorkflowType } from '../../../shared/types'
import {
  IWorkflowStepConditionalSchema,
  IWorkflowStepDynamicSchema,
  IWorkflowStepSchema,
  IWorkflowStepStaticSchema,
} from '../../types'
import { transformEmails } from '../modules/form/form.utils'

const WorkflowStepSchema = new Schema<IWorkflowStepSchema>(
  {
    workflow_type: {
      type: String,
      enum: Object.values(WorkflowType),
      default: WorkflowType.Static,
      required: true,
    },
    edit: {
      type: [{ type: Schema.Types.ObjectId }],
      required: true,
    },
    approval_field: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    discriminatorKey: 'workflow_type',
  },
)

export const WorkflowStepStaticSchema = new Schema<IWorkflowStepStaticSchema>({
  emails: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
    set: transformEmails,
    validate: {
      validator: (v: string[]) => {
        if (!Array.isArray(v)) return false
        return v.every((email) => validator.isEmail(email))
      },
      message: 'Please provide valid email addresses',
    },
    default: [],
    required: true,
  },
})

export const WorkflowStepDynamicSchema = new Schema<IWorkflowStepDynamicSchema>(
  {
    field: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
)

export const WorkflowStepConditionalSchema =
  new Schema<IWorkflowStepConditionalSchema>({
    conditional_field: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  })

export default WorkflowStepSchema
