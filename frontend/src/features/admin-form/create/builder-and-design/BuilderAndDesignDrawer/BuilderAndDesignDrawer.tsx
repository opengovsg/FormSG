import { useMemo } from 'react'
import { Flex } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'

import { useIsMobile } from '~hooks/useIsMobile'
import { MotionBox } from '~components/motion'

import {
  DrawerTabs,
  useCreatePageSidebar,
} from '../../common/CreatePageSidebarContext'
import EndPageDrawer from '../../end-page/EndPageDrawer'
import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

import DesignDrawer from './DesignDrawer'
import { EditFieldDrawer } from './EditFieldDrawer'
import { FieldListDrawer } from './FieldListDrawer'

export const BuilderAndDesignDrawer = (): JSX.Element | null => {
  const isMobile = useIsMobile()
  const { activeTab, isDrawerOpen, drawerRef } = useCreatePageSidebar()
  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)

  const drawerMotionProps = useMemo(() => {
    return {
      initial: { width: 0 },
      animate: {
        maxWidth: isMobile ? '100%' : '33.25rem',
        width: isMobile ? '100%' : '36%',
        transition: {
          bounce: 0,
          duration: 0.2,
        },
      },
      exit: {
        width: 0,
        opacity: 0,
        transition: {
          duration: 0.2,
        },
      },
    }
  }, [isMobile])

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
        // Logic or endpage drawer open
        return <EndPageDrawer />
    }
  }, [fieldBuilderState, activeTab])

  return (
    <AnimatePresence>
      {isDrawerOpen ? (
        <MotionBox
          bg="white"
          key="sidebar"
          pos="relative"
          as="aside"
          overflow="hidden"
          {...drawerMotionProps}
        >
          <Flex w="100%" h="100%" flexDir="column" ref={drawerRef}>
            {renderDrawerContent}
          </Flex>
        </MotionBox>
      ) : null}
    </AnimatePresence>
  )
}
