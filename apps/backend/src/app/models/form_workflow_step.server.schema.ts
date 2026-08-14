import { WorkflowType } from 'formsg-shared/types'
import { Schema } from 'mongoose'
import validator from 'validator'

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

// `field` and `conditional_field` are deliberately optional: a half-built step
// on a Private form must be able to persist without one. Completeness is
// enforced by `isStepComplete` in the service layer, not here, so that the rule
// can depend on the form's status. See FRM-2489.
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
