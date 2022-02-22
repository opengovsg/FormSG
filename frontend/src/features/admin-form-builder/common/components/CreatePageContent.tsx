import {
  DrawerTabs,
  useCreatePageDrawer,
} from '~features/admin-form-builder/CreatePageDrawerContext'
import BuilderAndDesign from '~features/admin-form-builder/design'
import CreatePageLogicTab from '~features/admin-form-builder/logic'

export const CreatePageContent = (): JSX.Element => {
  const { activeTab } = useCreatePageDrawer()
  if (activeTab === DrawerTabs.Logic) {
    return <CreatePageLogicTab />
  }

  return <BuilderAndDesign />
}
