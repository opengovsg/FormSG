import {
  FormWorkflowDto,
  StrippedFormWorkflowDto,
  WorkflowType,
} from '../types'

export function stripWorkflowEmails(
  workflow: FormWorkflowDto,
): StrippedFormWorkflowDto {
  return workflow.map((step) => {
    if (step.workflow_type === WorkflowType.Static) {
      // oxlint-disable-next-line typescript/no-unused-vars
      const { emails, ...rest } = step
      return rest
    }
    return step
  })
}
