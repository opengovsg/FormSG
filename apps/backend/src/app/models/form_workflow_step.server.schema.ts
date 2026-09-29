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

import { FORM_WHITELISTED_SUBMITTER_IDS_ID } from './form_whitelist.server.model'

// Mirrors the form-level whitelistedSubmitterIds.
const WorkflowStepWhitelistSchema = new Schema(
  {
    isWhitelistEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    encryptedWhitelistedSubmitterIds: {
      type: Schema.Types.ObjectId,
      // Defer loading of the ref due to circular dependency on schema IDs.
      ref: () => FORM_WHITELISTED_SUBMITTER_IDS_ID,
      required: false,
      default: undefined,
    },
  },
  { _id: false },
)

// Login for steps after the first. Step 1 uses the form-level auth settings.
const WorkflowStepAuthSchema = new Schema(
  {
    auth_type: {
      type: String,
      enum: [FormAuthType.MyInfo, FormAuthType.CP],
      required: true,
    },
    is_submitter_id_collection_enabled: {
      type: Boolean,
      required: true,
    },
    whitelisted_submitter_ids: {
      type: WorkflowStepWhitelistSchema,
      required: false,
    },
  },
  {
    _id: false,
    // JSON hides the list reference (nested getters don't run in toJSON); toObject stays raw.
    toJSON: {
      transform: (_doc, ret) => {
        if (ret.whitelisted_submitter_ids) {
          ret.whitelisted_submitter_ids = {
            isWhitelistEnabled:
              !!ret.whitelisted_submitter_ids.isWhitelistEnabled,
          }
        }
        return ret
      },
    },
  },
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
    step_name: {
      type: String,
      required: false,
    },
    auth: {
      type: WorkflowStepAuthSchema,
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
