import { useCallback } from 'react'
import { Box, chakra, useStyleConfig } from '@chakra-ui/react'

import {
  SidebarSectionMeta,
  usePublicFormContext,
} from '~features/public-form/PublicFormContext'

import { useFormSections } from './FormSectionsContext'

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
  const { sectionRefs, setActiveSectionId } = useFormSections()
  const { miniHeaderRef, onMobileDrawerClose } = usePublicFormContext()

  const handleClick = useCallback(() => {
    const sectionRef = sectionRefs[sectionMeta._id]
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
    sectionRef.current.focus()
    setActiveSectionId(sectionMeta._id)
  }, [
    sectionRefs,
    sectionMeta._id,
    miniHeaderRef,
    onMobileDrawerClose,
    setActiveSectionId,
  ])

  const styles = useStyleConfig('Link', {
    colorScheme: 'secondary',
    variant: 'standalone',
  })

  return (
    <chakra.button
      __css={styles}
      fontWeight={isActive ? 500 : 400}
      alignItems="center"
      pos="relative"
      d="flex"
      pl="0.5rem"
      textAlign="start"
      color={isActive ? 'secondary.700' : 'secondary.400'}
      onClick={handleClick}
    >
      {isActive && (
        <Box
          pos="absolute"
          left="-1.5rem"
          w="1.5rem"
          h="2px"
          bg="secondary.700"
          aria-hidden
        />
      )}
      {sectionMeta.title}
    </chakra.button>
  )
}
