import { FormWorkflowStep } from '~shared/types/form'

export enum AdminEditWorkflowState {
  CreatingStep,
  EditingStep,
}

export type EditStepInputs = Pick<FormWorkflowStep, 'emails'>
