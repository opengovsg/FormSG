import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create/common/CreatePageSidebarContext'

import { BuilderAndDesignTab } from '../../builder-and-design/BuilderAndDesignTab'
import { CreatePageLogicTab } from '../../logic/CreatePageLogicTab'

export const CreatePageContent = (): JSX.Element => {
  const { activeTab } = useCreatePageSidebar()
  if (activeTab === DrawerTabs.Logic) {
    return <CreatePageLogicTab />
  }

  return <BuilderAndDesignTab />
}
