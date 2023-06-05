import { useMemo } from 'react'
import {
  Box,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  ListItem,
  Spacer,
  Text,
  UnorderedList,
  VisuallyHidden,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'
import { PUBLICFORM_INSTRUCTIONS_SECTIONID } from '../FormInstructions/FormInstructionsContainer'

import { SidebarLink } from './SidebarLink'

export const SectionSidebar = (): JSX.Element => {
  const { sectionScrollData, activeSectionId, navigatedSectionId } =
    useFormSections()
  const {
    form,
    miniHeaderRef,
    submissionData,
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

  const navigatedSection = useMemo(() => {
    if (!navigatedSectionId || !form) return
    if (navigatedSectionId === PUBLICFORM_INSTRUCTIONS_SECTIONID) {
      return { title: 'Instructions', description: form.startPage.paragraph }
    }
    return form.form_fields.find((ff) => ff._id === navigatedSectionId)
  }, [form, navigatedSectionId])

  if (isMobile)
    return (
      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={onMobileDrawerClose}
        placement="left"
      >
        <DrawerOverlay />
        <DrawerContent maxW="16.5rem">
          <DrawerBody px={0} py="1.25rem">
            <Flex as="nav" aria-label="Form sections" flexDir="column">
              <Text px="1.5rem" textStyle="subhead-1">
                Skip to section
              </Text>
              <Divider mt="0.75rem" mb="1.75rem" />
              <UnorderedList
                px="3rem"
                spacing="1.25rem"
                alignItems="flex-start"
                marginInlineStart={0}
              >
                {sectionScrollData?.map((d) => (
                  <ListItem key={d._id} listStyleType="none">
                    <SidebarLink
                      isActive={activeSectionId === d._id}
                      sectionMeta={d}
                    />
                  </ListItem>
                ))}
              </UnorderedList>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    )

  return submissionData ? (
    <Spacer />
  ) : (
    <Box
      as="nav"
      aria-label="Jump to form section"
      flex={1}
      d={{ base: 'none', md: 'initial' }}
      minW={sectionScrollData.length > 0 ? '20%' : undefined}
    >
      <UnorderedList
        pos="sticky"
        top={sectionTopOffset}
        spacing="1.25rem"
        alignSelf="flex-start"
        alignItems="flex-start"
        marginInlineStart={0}
        marginEnd="1rem"
        aria-label="List of form section links"
      >
        {sectionScrollData?.map((d) => (
          <ListItem key={d._id} listStyleType="none">
            <SidebarLink isActive={activeSectionId === d._id} sectionMeta={d} />
          </ListItem>
        ))}
      </UnorderedList>
      {navigatedSection && (
        <VisuallyHidden aria-live="assertive" aria-atomic>
          Navigated to section: {navigatedSection.title}
          {navigatedSection.description
            ? `, ${navigatedSection.description}`
            : ''}
        </VisuallyHidden>
      )}
    </Box>
  )
}
