import BuilderAndDesign from '~features/admin-form/create/builder-and-design'
import {
  DrawerTabs,
  useCreatePageDrawer,
} from '~features/admin-form/create/CreatePageDrawerContext'

import CreatePageLogicTab from '../../logic'

export const CreatePageContent = (): JSX.Element => {
  const { activeTab } = useCreatePageDrawer()
  if (activeTab === DrawerTabs.Logic) {
    return <CreatePageLogicTab />
  }

  return <BuilderAndDesign />
}
