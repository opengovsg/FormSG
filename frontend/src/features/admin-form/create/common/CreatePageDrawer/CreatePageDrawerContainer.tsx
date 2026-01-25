import { useMemo } from 'react'
import { Flex } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'

import { useIsMobile } from '~hooks/useIsMobile'
import { MotionBox } from '~templates/MotionBox'

import { useCreatePageSidebar } from '../CreatePageSidebarContext'
import { useCreatePageSidebarLayout } from '../CreatePageSideBarLayoutContext'

export const CreatePageDrawerContainer = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const isMobile = useIsMobile()
  const { isDrawerOpen } = useCreatePageSidebar()
  const { drawerRef } = useCreatePageSidebarLayout()

  const drawerMotionProps = useMemo(() => {
    if (isMobile) {
      // Mobile: take all viewport width minus the 56px sidebar
      return {
        initial: { width: 0 },
        animate: {
          width: 'calc(100vw - 56px)',
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
    }

    // Desktop: expand width like before
    return {
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
  }, [isMobile])
  return (
    <AnimatePresence>
      {isDrawerOpen ? (
        <>
          <MotionBox
            {...(!isMobile && {
              borderRight: '1px solid',
              borderColor: 'neutral.300',
            })}
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
        </>
      ) : null}
    </AnimatePresence>
  )
}
