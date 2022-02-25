import { BiGitMerge } from 'react-icons/bi'
import { Stack } from '@chakra-ui/react'

import { BxsColorFill } from '~assets/icons/BxsColorFill'
import { BxsWidget } from '~assets/icons/BxsWidget'

import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create-2/common/CreatePageSidebarContext/CreatePageSidebarContext'

import { DrawerTabIcon } from './DrawerTabIcon'

export const CreatePageSidebar = (): JSX.Element => {
  const { activeTab, handleBuilderClick, handleDesignClick, handleLogicClick } =
    useCreatePageSidebar()

  return (
    <Stack
      bg="white"
      spacing="0.5rem"
      py="1rem"
      px="0.5rem"
      borderRight="1px solid"
      borderColor="neutral.300"
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
