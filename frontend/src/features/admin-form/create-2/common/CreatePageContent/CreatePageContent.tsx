import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create-2/common/CreatePageSidebarContext'

import { BuilderAndDesignTab } from '../../builder-and-design/BuilderAndDesignTab'
import { LogicTab } from '../../logic'

export const CreatePageContent = (): JSX.Element => {
  const { activeTab } = useCreatePageSidebar()
  if (activeTab === DrawerTabs.Logic) {
    return <LogicTab />
  }

  return <BuilderAndDesignTab />
}
