import {
  DrawerTabs,
  useCreatePageDrawer,
} from '~features/admin-form/create/CreatePageDrawerContext'
import BuilderAndDesign from '~features/admin-form/create/design'
import CreatePageLogicTab from '~features/admin-form/create/logic'

export const CreatePageContent = (): JSX.Element => {
  const { activeTab } = useCreatePageDrawer()
  if (activeTab === DrawerTabs.Logic) {
    return <CreatePageLogicTab />
  }

  return <BuilderAndDesign />
}
