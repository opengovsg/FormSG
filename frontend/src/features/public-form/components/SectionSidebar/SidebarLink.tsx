import { useCallback, useMemo } from 'react'
import { Box, chakra, useStyleConfig, VisuallyHidden } from '@chakra-ui/react'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import {
  SidebarSectionMeta,
  useFormSections,
} from '../FormFields/FormSectionsContext'

interface SidebarLinkProps {
  /**
   * Whether the sidebar link is currently active
   */
  isActive: boolean

  /**
   * Section this link corresponds to
   */
  sectionMeta: SidebarSectionMeta
}

export const SidebarLink = ({
  isActive,
  sectionMeta,
}: SidebarLinkProps): JSX.Element => {
  const { sectionRefs, setNavigatedSectionId } = useFormSections()
  const { miniHeaderRef, onMobileDrawerClose } = usePublicFormContext()

  const sectionRef = useMemo(
    () => sectionRefs[sectionMeta._id],
    [sectionMeta._id, sectionRefs],
  )

  const handleClick = useCallback(() => {
    if (!sectionRef || !sectionRef.current) return

    const headerOffset = miniHeaderRef.current?.clientHeight ?? 0
    const sectionPosition = sectionRef.current.getBoundingClientRect().top
    // Add additional buffer of 16px for scroll padding.
    const offsetPosition = sectionPosition - headerOffset - 16

    onMobileDrawerClose()

    window.scrollBy({
      top: offsetPosition,
      behavior: 'smooth',
    })
    // Remove scrolling on focus to prevent app from jumping immediately to the
    // element without smooth scrolling.
    sectionRef.current.focus({ preventScroll: true })
    setNavigatedSectionId(sectionMeta._id)
  }, [
    sectionRef,
    miniHeaderRef,
    onMobileDrawerClose,
    sectionMeta._id,
    setNavigatedSectionId,
  ])

  const styles = useStyleConfig('Link', {
    colorScheme: 'sub',
    variant: 'standalone',
  })

  return (
    <chakra.button
      __css={styles}
      fontWeight={isActive ? 500 : 400}
      alignItems="center"
      pos="relative"
      display="flex"
      pl="0.5rem"
      textAlign="start"
      color={isActive ? 'brand.secondary.700' : 'brand.secondary.400'}
      onClick={handleClick}
    >
      {isActive && (
        <Box
          pos="absolute"
          left="-1.5rem"
          w="1.5rem"
          h="2px"
          bg="brand.secondary.700"
          aria-hidden
        />
      )}
      <VisuallyHidden>Navigate to section: </VisuallyHidden>
      {sectionMeta.title}
    </chakra.button>
  )
}
