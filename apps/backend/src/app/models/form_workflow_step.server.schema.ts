import { FormAuthType, WorkflowType } from 'formsg-shared/types'
import { Schema } from 'mongoose'
import validator from 'validator'

import {
  IWorkflowStepConditionalSchema,
  IWorkflowStepDynamicSchema,
  IWorkflowStepSchema,
  IWorkflowStepStaticSchema,
} from '../../types'
import { transformEmails } from '../modules/form/form.utils'

// Only MRF Steps 2+ uses step-level auth settings
// Step 1 login uses form-level settings
const WorkflowStepAuthSchema = new Schema(
  {
    auth_type: {
      type: String,
      enum: [FormAuthType.MyInfo, FormAuthType.CP],
      required: true,
    },
  },
  { _id: false, strict: 'throw' },
)

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
    is_approval_enabled: {
      type: Boolean,
      required: false,
    },
    auth: { type: WorkflowStepAuthSchema, default: undefined },
    step_name: {
      type: String,
      required: false,
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
      required: false,
    },
  },
)

export const WorkflowStepConditionalSchema =
  new Schema<IWorkflowStepConditionalSchema>({
    conditional_field: {
      type: Schema.Types.ObjectId,
      required: false,
    },
  })

export default WorkflowStepSchema
