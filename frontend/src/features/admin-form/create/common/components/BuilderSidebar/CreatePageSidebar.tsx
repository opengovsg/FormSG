import { BiGitMerge } from 'react-icons/bi'
import { Stack } from '@chakra-ui/react'

import { BxsColorFill } from '~assets/icons/BxsColorFill'
import { BxsWidget } from '~assets/icons/BxsWidget'
import { useIsMobile } from '~hooks/useIsMobile'

import {
  DrawerTabs,
  useCreatePageDrawer,
} from '~features/admin-form/create/CreatePageDrawerContext'

import { DrawerTabIcon } from './DrawerTabIcon'
import { MobileBuilderSidebar } from './MobileBuilderSidebar'

export const CreatePageSidebar = (): JSX.Element => {
  const { activeTab, handleBuilderClick, handleDesignClick, handleLogicClick } =
    useCreatePageDrawer()

  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileBuilderSidebar />
  }

  return (
    <Stack
      bg="white"
      spacing="0.5rem"
      py="1rem"
      px="0.5rem"
      borderRight="1px solid"
      borderColor="neutral.300"
      direction={{ base: 'row', md: 'column' }}
    >
      <DrawerTabIcon
        label="Build your form"
        icon={<BxsWidget fontSize="1.5rem" />}
        onClick={handleBuilderClick}
        isActive={activeTab === DrawerTabs.Builder}
      />
      <DrawerTabIcon
        label="Design your form"
        icon={<BxsColorFill fontSize="1.5rem" />}
        onClick={handleDesignClick}
        isActive={activeTab === DrawerTabs.Design}
      />
      <DrawerTabIcon
        label="Add conditional logic"
        icon={<BiGitMerge fontSize="1.5rem" />}
        onClick={handleLogicClick}
        isActive={activeTab === DrawerTabs.Logic}
      />
    </Stack>
  )
}
