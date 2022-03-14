import { useMemo } from 'react'
import { Flex } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'

import { useIsMobile } from '~hooks/useIsMobile'
import { MotionBox } from '~components/motion'

import {
  DrawerTabs,
  useCreatePageSidebar,
} from '../../common/CreatePageSidebarContext'
import {
  BuildFieldState,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'

import { EditFieldDrawer } from './EditFieldDrawer'
import { FieldListDrawer } from './FieldListDrawer'

const DRAWER_MOTION_PROPS = {
  initial: { width: 0 },
  animate: {
    maxWidth: '33.25rem',
    width: '36%',
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

export const BuilderAndDesignDrawer = (): JSX.Element | null => {
  const isMobile = useIsMobile()
  const { activeTab, isDrawerOpen } = useCreatePageSidebar()
  const createOrEditData = useBuilderAndDesignStore(stateDataSelector)

  const renderDrawerContent = useMemo(() => {
    switch (activeTab) {
      case DrawerTabs.Builder: {
        if (
          createOrEditData.state === BuildFieldState.EditingField ||
          createOrEditData.state === BuildFieldState.CreatingField
        ) {
          return <EditFieldDrawer />
        }
        return <FieldListDrawer />
      }
      case DrawerTabs.Design:
        return <div>TODO: Design drawer contents</div>
      default:
        return null
    }
  }, [createOrEditData, activeTab])

  // Do not display in mobile
  if (isMobile) return null

  return (
    <AnimatePresence>
      {isDrawerOpen ? (
        <MotionBox
          bg="white"
          key="sidebar"
          pos="relative"
          as="aside"
          overflow="hidden"
          {...DRAWER_MOTION_PROPS}
        >
          <Flex w="100%" h="100%" minW="max-content" flexDir="column">
            {renderDrawerContent}
          </Flex>
        </MotionBox>
      ) : null}
    </AnimatePresence>
  )
}
