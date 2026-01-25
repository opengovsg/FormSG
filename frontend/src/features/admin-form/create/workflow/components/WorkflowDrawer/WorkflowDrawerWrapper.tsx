import { CreatePageDrawerContainer } from '../../../common/CreatePageDrawer/CreatePageDrawerContainer'
import { CreatePageSideBarLayoutProvider } from '../../../common/CreatePageSideBarLayoutContext'

import { WorkflowDrawer } from './WorkflowDrawer'

export const WorkflowDrawerWrapper = (): JSX.Element => {
  return (
    <CreatePageSideBarLayoutProvider>
      <CreatePageDrawerContainer>
        <WorkflowDrawer />
      </CreatePageDrawerContainer>
    </CreatePageSideBarLayoutProvider>
  )
}
