import { FormWorkflowStepDto, WorkflowType } from 'formsg-shared/types'

export interface CompletionItem {
  label: string
  stepIndex?: number
  section?: 'respondent' | 'fields'
}

export interface WorkflowCompletionStatus {
  done: CompletionItem[]
  left: CompletionItem[]
  firstIncompleteStepIndex: number | null
  firstIncompleteSection: string | null
}

function getStepDisplayName(step: FormWorkflowStepDto, index: number): string {
  const defaultName = `Step ${index + 1}`
  return step.step_name && step.step_name !== defaultName
    ? step.step_name
    : defaultName
}

function hasRespondentDetails(step: FormWorkflowStepDto): boolean {
  switch (step.workflow_type) {
    case WorkflowType.Static:
      return step.emails.length > 0
    case WorkflowType.Dynamic:
      return !!step.field
    case WorkflowType.Conditional:
      return !!step.conditional_field
    default:
      return false
  }
}

export function getWorkflowCompletionStatus(
  formWorkflow: FormWorkflowStepDto[],
): WorkflowCompletionStatus {
  const done: CompletionItem[] = []
  const left: CompletionItem[] = []

  // Always done
  done.push({
    label: `${formWorkflow.length} step${formWorkflow.length === 1 ? '' : 's'} created`,
  })
  done.push({ label: 'End-of-workflow email set up' })

  let firstIncompleteStepIndex: number | null = null
  let firstIncompleteSection: string | null = null

  formWorkflow.forEach((step, index) => {
    // Skip Step 1 respondent check — Step 1 is always "anyone with the form link"
    if (index > 0) {
      const name = getStepDisplayName(step, index)

      if (hasRespondentDetails(step)) {
        done.push({ label: `${name} has people set up`, stepIndex: index })
      } else {
        left.push({
          label: `${name}: Choose who fills it up when you're ready`,
          stepIndex: index,
          section: 'respondent',
        })
        if (firstIncompleteStepIndex === null) {
          firstIncompleteStepIndex = index
          firstIncompleteSection = 'respondent'
        }
      }
    }

    const name = getStepDisplayName(step, index)
    if (step.edit.length > 0) {
      done.push({ label: `${name} has fields to fill`, stepIndex: index })
    } else {
      left.push({
        label: `${name}: Pick fields to fill when you're ready`,
        stepIndex: index,
        section: 'fields',
      })
      if (firstIncompleteStepIndex === null) {
        firstIncompleteStepIndex = index
        firstIncompleteSection = 'fields'
      }
    }
  })

  return { done, left, firstIncompleteStepIndex, firstIncompleteSection }
}
