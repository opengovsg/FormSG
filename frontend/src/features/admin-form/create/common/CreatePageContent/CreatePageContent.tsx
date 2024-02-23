import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create/common/CreatePageSidebarContext'

import { BuilderAndDesignTab } from '../../builder-and-design/BuilderAndDesignTab'
import { EndPageTab } from '../../end-page/EndPageTab'
import { CreatePageLogicTab } from '../../logic/CreatePageLogicTab'
import { CreatePageWorkflowTab } from '../../workflow/CreatePageWorkflowTab'

export const CreatePageContent = (): JSX.Element => {
  const { activeTab } = useCreatePageSidebar()
  switch (activeTab) {
    case DrawerTabs.Logic:
      return <CreatePageLogicTab />
    case DrawerTabs.EndPage:
      return <EndPageTab />
    case DrawerTabs.Workflow:
      return <CreatePageWorkflowTab />
    default:
      // builder or design
      return <BuilderAndDesignTab />
  }
}
