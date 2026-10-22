import {
  AdminWorkflowEventType,
  WorkflowEventType,
} from '../types/workflow-event'

export const isAdminWorkflowEvent = <T extends { type: WorkflowEventType }>(
  event: T,
): event is T & { type: AdminWorkflowEventType } =>
  event.type !== WorkflowEventType.StepSubmitted
