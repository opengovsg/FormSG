import { useCallback } from 'react'
import { BiGitMerge } from 'react-icons/bi'
import { Stack } from '@chakra-ui/react'

import { BxsColorFill } from '~assets/icons/BxsColorFill'
import { BxsWidget } from '~assets/icons/BxsWidget'
import { useIsMobile } from '~hooks/useIsMobile'

import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create/common/CreatePageSidebarContext/CreatePageSidebarContext'

import {
  isDirtySelector,
  useDirtyFieldStore,
} from '../../builder-and-design/useDirtyFieldStore'
import {
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../../builder-and-design/useFieldBuilderStore'
import { FEATURE_TOUR } from '../../featureTour/constants'

import { DrawerTabIcon } from './DrawerTabIcon'

export const CreatePageSidebar = (): JSX.Element | null => {
  const isMobile = useIsMobile()
  const setFieldsToInactive = useFieldBuilderStore(setToInactiveSelector)
  const isDirty = useDirtyFieldStore(isDirtySelector)
  const { activeTab, handleBuilderClick, handleDesignClick, handleLogicClick } =
    useCreatePageSidebar()

  const handleDrawerBuilderClick = useCallback(() => {
    // Always show create field drawer when sidebar icon is tapped on mobile.
    if (isMobile) {
      setFieldsToInactive()
    }
    handleBuilderClick(isDirty)
  }, [handleBuilderClick, isDirty, isMobile, setFieldsToInactive])

  const handleDrawerDesignClick = useCallback(
    () => handleDesignClick(isDirty),
    [handleDesignClick, isDirty],
  )

  const handleDrawerLogicClick = useCallback(
    () => handleLogicClick(isDirty),
    [handleLogicClick, isDirty],
  )

  return (
    <Stack
      bg="white"
      spacing="0.5rem"
      py="1rem"
      px="0.5rem"
      pos="sticky"
      top={0}
      borderRight="1px solid"
      borderColor="neutral.300"
      direction="column"
    >
      <DrawerTabIcon
        label="Build your form"
        icon={<BxsWidget fontSize="1.5rem" />}
        onClick={handleDrawerBuilderClick}
        isActive={activeTab === DrawerTabs.Builder}
        id={FEATURE_TOUR[0].id}
      />
      <DrawerTabIcon
        label="Design your form"
        icon={<BxsColorFill fontSize="1.5rem" />}
        onClick={handleDrawerDesignClick}
        isActive={activeTab === DrawerTabs.Design}
        id={FEATURE_TOUR[1].id}
      />
      <DrawerTabIcon
        label="Add conditional logic"
        icon={<BiGitMerge fontSize="1.5rem" />}
        onClick={handleDrawerLogicClick}
        isActive={activeTab === DrawerTabs.Logic}
        id={FEATURE_TOUR[2].id}
      />
    </Stack>
  )
}
