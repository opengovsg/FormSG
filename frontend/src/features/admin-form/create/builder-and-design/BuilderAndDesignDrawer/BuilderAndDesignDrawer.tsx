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

import { EditEndPageDrawer } from './EditEndPageDrawer/EditEndPageDrawer'
import { EditFieldDrawer } from './EditFieldDrawer'
import { FieldListDrawer } from './FieldListDrawer'

export const BuilderAndDesignDrawer = (): JSX.Element | null => {
  const isMobile = useIsMobile()
  const { activeTab, isDrawerOpen } = useCreatePageSidebar()
  const createOrEditData = useBuilderAndDesignStore(stateDataSelector)

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

  const renderDrawerContent = useMemo(() => {
    switch (activeTab) {
      case DrawerTabs.Builder: {
        if (
          createOrEditData.state === BuildFieldState.EditingField ||
          createOrEditData.state === BuildFieldState.CreatingField
        ) {
          return <EditFieldDrawer />
        } else if (createOrEditData.state === BuildFieldState.EditingEndPage) {
          return <EditEndPageDrawer />
        }
        return <FieldListDrawer />
      }
      case DrawerTabs.Design:
        return <div>TODO: Design drawer contents</div>
      default:
        return null
    }
  }, [createOrEditData, activeTab])

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
          <Flex w="100%" h="100%" flexDir="column">
            {renderDrawerContent}
          </Flex>
        </MotionBox>
      ) : null}
    </AnimatePresence>
  )
}
