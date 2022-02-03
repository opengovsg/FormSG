import { useMemo } from 'react'
import { Flex } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'

import { MotionBox } from '~components/motion'

import { DrawerTabs, useBuilderDrawer } from '../../BuilderDrawerContext'
import { activeFieldSelector, useEditFieldStore } from '../../editFieldStore'

import { CreateFieldDrawer } from './CreateFieldDrawer'
import { EditFieldDrawer } from './EditFieldDrawer'

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

export const BuilderDrawer = (): JSX.Element => {
  const { isShowDrawer, activeTab } = useBuilderDrawer()
  const activeField = useEditFieldStore(activeFieldSelector)

  const renderDrawerContent = useMemo(() => {
    switch (activeTab) {
      case DrawerTabs.Builder: {
        if (activeField) {
          return <EditFieldDrawer />
        }
        return <CreateFieldDrawer />
      }
      case DrawerTabs.Design:
        return <div>TODO: Design drawer contents</div>
      case DrawerTabs.Logic:
        return <div>TODO: Logic drawer contents</div>
    }
  }, [activeField, activeTab])

  return (
    <AnimatePresence>
      {isShowDrawer ? (
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
