import { Document } from 'mongoose'

import {
  FormWorkflowStepBase,
  FormWorkflowStepConditional,
  FormWorkflowStepDynamic,
  FormWorkflowStepStatic,
  WorkflowType,
} from '../../shared/types'

import { IFieldSchema } from './field'

export interface IWorkflowStepSchema extends FormWorkflowStepBase, Document {
  // overwriting field id type to reflect mongoose Id type
  edit: IFieldSchema['_id'][]
}

export interface IWorkflowStepStaticSchema
  extends IWorkflowStepSchema,
    FormWorkflowStepStatic,
    Document {
  workflow_type: WorkflowType.Static
  emails: string[]
  edit: IFieldSchema['_id'][]
}

export interface IWorkflowStepDynamicSchema
  extends IWorkflowStepSchema,
    FormWorkflowStepDynamic,
    Document {
  workflow_type: WorkflowType.Dynamic
  field: IFieldSchema['_id']
  // overwriting field id type to reflect mongoose Id type
  edit: IFieldSchema['_id'][]
}

export interface IWorkflowStepConditionalSchema
  extends IWorkflowStepSchema,
    FormWorkflowStepConditional,
    Document {
  workflow_type: WorkflowType.Conditional
  edit: IFieldSchema['_id'][]
  conditional_field: IFieldSchema['_id']
}
