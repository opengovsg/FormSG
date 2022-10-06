import { useMemo } from 'react'
import { Flex } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'

import { useIsMobile } from '~hooks/useIsMobile'
import { MotionBox } from '~components/motion'

import { useCreatePageSidebar } from '../CreatePageSidebarContext'

export const CreatePageDrawerContainer = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const isMobile = useIsMobile()
  const { isDrawerOpen, drawerRef } = useCreatePageSidebar()

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
            {children}
          </Flex>
        </MotionBox>
      ) : null}
    </AnimatePresence>
  )
}
