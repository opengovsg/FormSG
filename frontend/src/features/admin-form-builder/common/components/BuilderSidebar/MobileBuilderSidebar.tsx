import { useMemo } from 'react'
import { BiGitMerge } from 'react-icons/bi'
import { Flex, TabList, Tabs } from '@chakra-ui/react'

import { BxsColorFill } from '~assets/icons/BxsColorFill'
import { BxsWidget } from '~assets/icons/BxsWidget'

import {
  DrawerTabs,
  useBuilderDrawer,
} from '~features/admin-form-builder/BuilderDrawerContext'

import { MobileSidebarTab } from './SidebarMobileTab'

export const MobileBuilderSidebar = (): JSX.Element => {
  const { activeTab, handleBuilderClick, handleDesignClick, handleLogicClick } =
    useBuilderDrawer()

  const tabIndex = useMemo(() => {
    switch (activeTab) {
      case DrawerTabs.Design:
        return 1
      case DrawerTabs.Logic:
        return 2
      case DrawerTabs.Builder:
      default:
        return 0
    }
  }, [activeTab])

  const handleTabChange = (index: number): void => {
    switch (index) {
      case 0:
        return handleBuilderClick()
      case 1:
        return handleDesignClick()
      case 2:
        return handleLogicClick()
    }
  }

  return (
    <Tabs
      isLazy
      isManual
      orientation="horizontal"
      variant="line"
      display="flex"
      index={tabIndex}
      onChange={handleTabChange}
    >
      <Flex
        h="max-content"
        flex={1}
        flexShrink={0}
        overflowX="auto"
        zIndex="docked"
        bg="neutral.100"
        borderTop="1px solid"
        borderTopColor="neutral.300"
        w="100vw"
        __css={{
          scrollbarWidth: 0,
          /* Scrollbar for Chrome, Safari, Opera and Microsoft Edge */
          '&::-webkit-scrollbar': {
            width: 0,
            height: 0,
          },
        }}
      >
        <TabList
          overflowX="initial"
          display="inline-flex"
          w="max-content"
          mx="1.5rem"
          mb="calc(0.5rem - 2px)"
        >
          <MobileSidebarTab label="Build your form" icon={BxsWidget} />
          <MobileSidebarTab label="Design your form" icon={BxsColorFill} />
          <MobileSidebarTab label="Add conditional logic" icon={BiGitMerge} />
        </TabList>
      </Flex>
    </Tabs>
  )
}
