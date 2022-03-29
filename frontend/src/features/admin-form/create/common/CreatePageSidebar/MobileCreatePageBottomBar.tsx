import { useMemo } from 'react'
import { BiGitMerge } from 'react-icons/bi'
import { Flex, TabList, Tabs } from '@chakra-ui/react'

import { BxsColorFill } from '~assets/icons/BxsColorFill'
import { BxsWidget } from '~assets/icons/BxsWidget'
import { useDraggable } from '~hooks/useDraggable'
import { useIsMobile } from '~hooks/useIsMobile'

import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create/common/CreatePageSidebarContext'

import { MobileSidebarTab } from './SidebarMobileTab'

export const MobileCreatePageBottomBar = (): JSX.Element | null => {
  const { activeTab, handleBuilderClick, handleDesignClick, handleLogicClick } =
    useCreatePageSidebar()
  const isMobile = useIsMobile()
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

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

  if (!isMobile) return null

  return (
    <Tabs
      isLazy
      isManual
      orientation="horizontal"
      variant="line"
      display="flex"
      pos="sticky"
      zIndex="sticky"
      bottom={0}
      index={tabIndex}
      onChange={handleTabChange}
    >
      <Flex
        ref={ref}
        onMouseDown={onMouseDown}
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
