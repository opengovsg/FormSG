import { useMemo } from 'react'

import { CreatePageDrawerContainer } from '../../common/CreatePageDrawer/CreatePageDrawerContainer'
import {
  DrawerTabs,
  useCreatePageSidebar,
} from '../../common/CreatePageSidebarContext'
import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

import DesignDrawer from './DesignDrawer'
import { EditFieldDrawer } from './EditFieldDrawer'
import { FieldListDrawer } from './FieldListDrawer'

export const BuilderAndDesignDrawer = (): JSX.Element | null => {
  const { activeTab } = useCreatePageSidebar()
  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)

  const renderDrawerContent: JSX.Element | null = useMemo(() => {
    switch (activeTab) {
      case DrawerTabs.Builder:
        switch (fieldBuilderState) {
          case FieldBuilderState.EditingField:
          case FieldBuilderState.CreatingField:
            return <EditFieldDrawer />
          default:
            // Inactive state
            return <FieldListDrawer />
        }
      case DrawerTabs.Design:
        return <DesignDrawer />
      default:
        // Logic or endpage open
        return null
    }
  }, [fieldBuilderState, activeTab])

  return (
    <CreatePageDrawerContainer>{renderDrawerContent}</CreatePageDrawerContainer>
  )
}
