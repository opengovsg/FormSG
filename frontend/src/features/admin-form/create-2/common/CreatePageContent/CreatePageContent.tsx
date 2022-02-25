import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create-2/common/CreatePageSidebarContext'

export const CreatePageContent = (): JSX.Element => {
  const { activeTab } = useCreatePageSidebar()
  if (activeTab === DrawerTabs.Logic) {
    return <div>Logic tab</div>
  }

  return <div>Builder and design</div>
}
