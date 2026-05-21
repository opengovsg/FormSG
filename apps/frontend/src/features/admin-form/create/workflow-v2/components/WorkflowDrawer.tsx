import { CreatePageDrawerContainer } from '../../common/CreatePageDrawer'
import { CreatePageSideBarLayoutProvider } from '../../common/CreatePageSideBarLayoutContext'
import {
  focusStateSelector,
  pendingInsertIndexSelector,
  useWorkflowBuilderStore,
} from '../workflowBuilderStore'

import { FocusedInsertPanel } from './AddStepsPanel/FocusedInsertPanel'
import { StepEditForm } from './AddStepsPanel/StepEditForm'
import { StepNamingForm } from './AddStepsPanel/StepNamingForm'
import { NotificationEditPanel } from './SummaryPanel/NotificationEditPanel'
import { StepEditPanel } from './SummaryPanel/StepEditPanel'
import { SummaryPanel } from './SummaryPanel/SummaryPanel'
import {
  AddRespondentsPanel,
  CreateDropdownFieldForm,
  CreateEmailFieldForm,
  EditRespondentForm,
  NewRespondentForm,
  NotificationFocusPanel,
  StepFocusRespondentPanel,
} from './AddRespondentsPanel'
import { AddStepsPanel } from './AddStepsPanel'
import { AssignFieldsPanel, StepFocusFieldPanel } from './AssignFieldsPanel'

const DrawerContent = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const pendingInsertIndex = useWorkflowBuilderStore(pendingInsertIndexSelector)

  switch (focusState.type) {
    case 'phase':
      if (focusState.phase === 'add_steps') {
        if (pendingInsertIndex !== null) return <FocusedInsertPanel />
        return <AddStepsPanel />
      }
      if (focusState.phase === 'add_respondents') {
        return <AddRespondentsPanel />
      }
      if (focusState.phase === 'assign_fields') {
        return <AssignFieldsPanel />
      }
      return <SummaryPanel />
    case 'step_naming':
      return <StepNamingForm />
    case 'step_edit':
      if (focusState.fromSummary) return <StepEditPanel />
      return <StepEditForm />
    case 'step_focus':
      if (focusState.phase === 'add_respondents') {
        return <StepFocusRespondentPanel />
      }
      if (focusState.phase === 'assign_fields') {
        return <StepFocusFieldPanel />
      }
      return <SummaryPanel />
    case 'new_respondent':
      return <NewRespondentForm />
    case 'edit_respondent':
      return <EditRespondentForm />
    case 'notification_edit':
      return <NotificationEditPanel />
    case 'notification_focus':
      return <NotificationFocusPanel />
    case 'create_field':
      if (focusState.fieldType === 'email') return <CreateEmailFieldForm />
      if (focusState.fieldType === 'dropdown')
        return <CreateDropdownFieldForm />
      return <SummaryPanel />
    default:
      return <SummaryPanel />
  }
}

export const WorkflowDrawer = (): JSX.Element => {
  return (
    <CreatePageSideBarLayoutProvider>
      <CreatePageDrawerContainer>
        <DrawerContent />
      </CreatePageDrawerContainer>
    </CreatePageSideBarLayoutProvider>
  )
}
