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
import { SummaryPanel } from './SummaryPanel/SummaryPanel'
import { AddStepsPanel } from './AddStepsPanel'

const DrawerContent = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const pendingInsertIndex = useWorkflowBuilderStore(pendingInsertIndexSelector)

  switch (focusState.type) {
    case 'phase':
      if (focusState.phase === 'add_steps') {
        // Focused insert mode: simplified panel
        if (pendingInsertIndex !== null) return <FocusedInsertPanel />
        return <AddStepsPanel />
      }
      return <SummaryPanel />
    case 'step_naming':
      return <StepNamingForm />
    case 'step_edit':
      return <StepEditForm />
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
