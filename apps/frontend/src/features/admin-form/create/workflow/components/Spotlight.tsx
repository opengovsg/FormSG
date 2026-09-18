import { Children, createContext, ReactNode, useContext } from 'react'

import { Box, Divider, Stack, usePrefersReducedMotion } from '@chakra-ui/react'

import { useIsWorkflowBuilderRedesign } from '../hooks/useIsWorkflowBuilderRedesign'
import { useWorkflowSurfaces } from '../hooks/useWorkflowSurfaces'

export const SPOTLIGHT_TEST_ID = 'workflow-spotlight'

const SpotlightActiveContext = createContext(false)

export const useIsSpotlightActiveSection = (): boolean =>
  useContext(SpotlightActiveContext)

const BAND_GAP = '1.5rem'

const ACTIVE_SCALE = 'scale(1.02)'

export interface SpotlightProps {
  isActive: boolean
  isEnabled?: boolean
  hasTopBorder?: boolean
  hasBottomBorder?: boolean
  children: ReactNode
}

export const Spotlight = ({
  isActive,
  isEnabled = true,
  hasTopBorder = false,
  hasBottomBorder = false,
  children,
}: SpotlightProps): JSX.Element => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const { cardRadius } = useWorkflowSurfaces()

  if (!isEnabled || !isRedesign) return <>{children}</>

  return (
    <Box
      data-testid={SPOTLIGHT_TEST_ID}
      py={BAND_GAP}
      bg={isActive ? 'primary.100' : 'transparent'}
      borderRadius={isActive ? cardRadius : '0'}
      borderTop="1px solid"
      borderTopColor={hasTopBorder ? 'neutral.300' : 'transparent'}
      borderBottom="1px solid"
      borderBottomColor={hasBottomBorder ? 'neutral.300' : 'transparent'}
      outline="2px solid"
      outlineColor={isActive ? 'primary.500' : 'transparent'}
      boxShadow={isActive ? 'md' : 'none'}
      opacity={isActive ? 1 : 0.5}
      _hover={{ opacity: 1 }}
      _focusWithin={{ opacity: 1 }}
      transform={isActive ? ACTIVE_SCALE : 'none'}
      transformOrigin="center"
      position="relative"
      zIndex={isActive ? 1 : 0}
      transition={
        prefersReducedMotion
          ? 'none'
          : [
              'opacity 0.3s ease',
              'background 0.3s ease',
              'outline-color 0.3s ease',
              'transform 0.3s ease',
              'box-shadow 0.3s ease',
              ...(isActive ? [] : ['border-radius 0.3s ease']),
            ].join(', ')
      }
    >
      <SpotlightActiveContext.Provider value={isActive}>
        {children}
      </SpotlightActiveContext.Provider>
    </Box>
  )
}

export interface SpotlightGroupProps {
  activeIndex: number | null
  isEnabled?: boolean
  children: ReactNode
}

export const SpotlightGroup = ({
  activeIndex,
  isEnabled = true,
  children,
}: SpotlightGroupProps): JSX.Element => {
  const isRedesign = useIsWorkflowBuilderRedesign()

  const sections = Children.toArray(children)

  if (!isEnabled || !isRedesign) {
    return (
      <Stack spacing={BAND_GAP} pt={BAND_GAP}>
        {sections.flatMap((section, i) =>
          i === 0 ? [section] : [<Divider key={`line-${i}`} />, section],
        )}
        <Divider />
      </Stack>
    )
  }

  return (
    <Stack spacing="0">
      {sections.map((section, i) => {
        const isActive = i === activeIndex
        const isBelowActive = activeIndex !== null && i === activeIndex + 1

        return (
          <Spotlight
            key={i}
            isActive={isActive}
            hasTopBorder={i > 0 && !isActive && !isBelowActive}
            hasBottomBorder={i === sections.length - 1 && !isActive}
          >
            {section}
          </Spotlight>
        )
      })}
    </Stack>
  )
}
