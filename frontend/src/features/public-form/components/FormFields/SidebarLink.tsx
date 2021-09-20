import { useCallback } from 'react'
import { Box, chakra, useStyleConfig } from '@chakra-ui/react'

import { useFormSections } from './FormSectionsContext'
import { SidebarSectionMeta } from './SectionSidebar'

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
  const { sectionRefs } = useFormSections()

  const handleClick = useCallback(() => {
    const ref = sectionRefs[sectionMeta._id]
    if (!ref || !ref.current) return
    return ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [sectionMeta._id, sectionRefs])

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
