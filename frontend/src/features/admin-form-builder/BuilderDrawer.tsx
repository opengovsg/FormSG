import { Box } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'

import { MotionBox } from '~components/motion'

import { EditFieldDrawer } from './EditFieldDrawer/EditFieldDrawer'
import { useBuilderDrawer } from './BuilderDrawerContext'

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
  const { isShowDrawer } = useBuilderDrawer()

  return (
    <AnimatePresence>
      {isShowDrawer && (
        <MotionBox
          bg="white"
          key="sidebar"
          pos="relative"
          as="aside"
          overflow="auto"
          {...DRAWER_MOTION_PROPS}
        >
          <Box w="100%" h="100%" minW="max-content">
            <EditFieldDrawer />
          </Box>
        </MotionBox>
      )}
    </AnimatePresence>
  )
}
