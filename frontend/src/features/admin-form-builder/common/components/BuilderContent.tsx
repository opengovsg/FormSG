import {
  DrawerTabs,
  useBuilderDrawer,
} from '~features/admin-form-builder/BuilderDrawerContext'
import BuilderDesign from '~features/admin-form-builder/design'
import BuilderLogic from '~features/admin-form-builder/logic'
import { BuilderLogicProvider } from '~features/admin-form-builder/logic/BuilderLogicContext'

export const BuilderContent = (): JSX.Element => {
  const { activeTab } = useBuilderDrawer()
  if (activeTab === DrawerTabs.Logic) {
    return (
      <BuilderLogicProvider>
        <BuilderLogic />
      </BuilderLogicProvider>
    )
  }

  return <BuilderDesign />
}
