import { WorkflowType } from '~shared/types/form/workflow'

export const WORKFLOW_TYPE_VALIDATION = {
  required: 'Please select a respondent type',
  validate: (value: WorkflowType) => {
    if (!Object.values(WorkflowType).includes(value)) {
      return 'The selected respondent type is invalid'
    }
  },
}
