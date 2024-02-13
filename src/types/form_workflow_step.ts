import { Document } from 'mongoose'

import {
  FormWorkflowStepBase,
  FormWorkflowStepDynamic,
  FormWorkflowStepStatic,
  WorkflowType,
} from '../../shared/types'

import { IFieldSchema } from './field'

export interface IWorkflowStepSchema extends FormWorkflowStepBase, Document {}

export interface IWorkflowStepStaticSchema
  extends IWorkflowStepSchema,
    FormWorkflowStepStatic,
    Document {
  workflow_type: WorkflowType.Static
  emails: string[]
}

export interface IWorkflowStepDynamicSchema
  extends IWorkflowStepSchema,
    FormWorkflowStepDynamic,
    Document {
  workflow_type: WorkflowType.Dynamic
  // overwriting field id type in show to reflect mongoose Id type
  field: IFieldSchema['_id']
}

export type FormWorkflowStepSchema =
  | IWorkflowStepStaticSchema
  | IWorkflowStepDynamicSchema
