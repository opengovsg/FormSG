import { useMemo } from 'react'
import {
  Box,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Text,
  VStack,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from './FormSectionsContext'
import { SidebarLink } from './SidebarLink'

export const SectionSidebar = (): JSX.Element => {
  const { activeSectionId } = useFormSections()
  const {
    miniHeaderRef,
    sectionScrollData,
    isMobileDrawerOpen,
    onMobileDrawerClose,
  } = usePublicFormContext()
  const isMobile = useIsMobile()

  // Used for offsetting the section sidebar when the mini header is open.
  const sectionTopOffset = useMemo(() => {
    // Current height of the mini header + 52px from the top
    const offsetPx = (miniHeaderRef?.current?.clientHeight ?? 0) + 52
    return `${offsetPx}px`
    // Require ignore as miniHeaderRef is an object and dependency comparison
    // will never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miniHeaderRef?.current?.clientHeight])

  if (isMobile && isMobileDrawerOpen && activeSectionId)
    return (
      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={onMobileDrawerClose}
        placement="left"
      >
        <DrawerOverlay />
        <DrawerContent maxW="16.5rem">
          <DrawerBody px={0} py="1.25rem">
            <Flex flexDir="column">
              <Text px="1.5rem" textStyle="subhead-1">
                Skip to section
              </Text>
              <Divider mt="0.75rem" mb="1.75rem" />
              <VStack px="3rem" spacing="1.25rem" alignItems="flex-start">
                {sectionScrollData?.map((d) => (
                  <Flex key={d._id} align="left">
                    <SidebarLink
                      isActive={activeSectionId === d._id}
                      sectionMeta={d}
                    />
                  </Flex>
                ))}
              </VStack>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    )

  return (
    <Box
      flex={1}
      d={{ base: 'none', md: 'initial' }}
      minW={sectionScrollData.length > 0 ? '20%' : undefined}
    >
      <VStack
        pos="sticky"
        top={sectionTopOffset}
        spacing="1.25rem"
        alignSelf="flex-start"
        align="flex-start"
        marginEnd="1rem"
      >
        {sectionScrollData?.map((d) => (
          <Flex key={d._id} align="center">
            <SidebarLink isActive={activeSectionId === d._id} sectionMeta={d} />
          </Flex>
        ))}
      </VStack>
    </Box>
  )
}
