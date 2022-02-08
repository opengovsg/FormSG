import {
  DrawerTabs,
  useBuilderDrawer,
} from '~features/admin-form-builder/BuilderDrawerContext'
import BuilderDesign from '~features/admin-form-builder/design'
import BuilderLogic from '~features/admin-form-builder/logic'

export const BuilderContent = (): JSX.Element => {
  const { activeTab } = useBuilderDrawer()
  if (activeTab === DrawerTabs.Logic) {
    return <BuilderLogic />
  }

  return <BuilderDesign />
}
