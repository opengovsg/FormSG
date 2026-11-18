import { ReactNode, useEffect, useRef, useState } from 'react'
import { Box } from '@chakra-ui/react'

import { getResponseScrollContainer } from './getResponseScrollContainer'

/** Keep the action row in the page's scroll container, not inside the short overview. */
export const ResponseOverview = ({
  children,
  actions,
}: {
  children: ReactNode
  actions?: ReactNode
}): JSX.Element => {
  const markerRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(false)
  const hasActions = !!actions
  useEffect(() => {
    const marker = markerRef.current
    if (!marker || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPinned(
          !entry.isIntersecting &&
            entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
        )
      },
      {
        root: getResponseScrollContainer(marker),
        rootMargin: '-12px 0px 0px 0px',
        threshold: 0,
      },
    )
    observer.observe(marker)
    return () => observer.disconnect()
  }, [hasActions])
  return (
    <>
      <Box
        bg="primary.100"
        p="1.5rem"
        border="1px solid"
        borderColor="neutral.300"
        borderBottomWidth={hasActions ? 0 : '1px'}
        borderRadius={hasActions ? '8px 8px 0 0' : '8px'}
      >
        {children}
      </Box>
      {hasActions && (
        <>
          <Box ref={markerRef} h="1px" mb="-1px" aria-hidden />
          <Box
            position={{ base: 'static', md: 'sticky' }}
            top="-0.75rem"
            zIndex={1}
            bg="primary.100"
            px="1.5rem"
            py={{ base: '1.5rem', md: pinned ? '1rem' : '1.5rem' }}
            border="1px solid"
            borderColor="neutral.300"
            borderRadius={{
              base: '0 0 8px 8px',
              md: pinned ? '8px' : '0 0 8px 8px',
            }}
            boxShadow={{
              base: 'none',
              md: pinned ? '0 4px 8px rgba(0, 0, 0, 0.08)' : 'none',
            }}
            transitionProperty="border-radius, box-shadow"
            transitionDuration="normal"
          >
            {actions}
          </Box>
        </>
      )}
    </>
  )
}
