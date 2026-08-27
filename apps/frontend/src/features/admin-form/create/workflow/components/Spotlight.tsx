import { Box, usePrefersReducedMotion } from '@chakra-ui/react'

interface SpotlightProps {
  /** This section is the current decision. */
  isActive: boolean
  /**
   * Whether the spotlight applies at all. When false, children render
   * untouched — no wrapper styling, no reserved border, no padding.
   */
  isEnabled?: boolean
  children: React.ReactNode
}

/**
 * Marks the one section an admin is meant to act on right now.
 *
 * The inactive state carries a 2px transparent border on purpose. It reserves
 * the same space the active border occupies, so sections do not shift when the
 * spotlight moves onto them. Simplifying it to `border: none` reintroduces a
 * 2px jump on every Continue.
 *
 * The 2rem inline margin insets the active section, making it narrower than the
 * sections around it. That is deliberate — it reads as a focused panel within
 * the card, and is not an alignment bug to zero out.
 *
 * Dimming is presentation only. A dimmed section stays fully interactive, so an
 * admin who scrolls up to fix an earlier answer can do it without leaving the
 * flow. Hover and focus-within restore full opacity, which is what covers a
 * section an admin deliberately returns to.
 */
export const Spotlight = ({
  isActive,
  isEnabled = true,
  children,
}: SpotlightProps): JSX.Element => {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (!isEnabled) return <>{children}</>

  return (
    <Box
      bg={isActive ? 'primary.100' : 'transparent'}
      borderRadius={isActive ? '8px' : '0'}
      border={isActive ? '2px solid' : '2px solid transparent'}
      borderColor={isActive ? 'primary.500' : 'transparent'}
      opacity={isActive ? 1 : 0.5}
      _hover={{ opacity: 1 }}
      _focusWithin={{ opacity: 1 }}
      transition={
        prefersReducedMotion
          ? 'none'
          : 'opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease'
      }
      mx={isActive ? '2rem' : '0'}
      py={isActive ? '2rem' : '0.5rem'}
    >
      {children}
    </Box>
  )
}
