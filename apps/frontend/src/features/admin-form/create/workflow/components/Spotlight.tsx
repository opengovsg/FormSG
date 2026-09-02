import { ReactNode } from 'react'
import { Box, usePrefersReducedMotion } from '@chakra-ui/react'

import { useIsWorkflowBuilderRedesign } from '../hooks/useIsWorkflowBuilderRedesign'

export const SPOTLIGHT_TEST_ID = 'workflow-spotlight'

export interface SpotlightProps {
  /** This section is the current decision. */
  isActive: boolean
  /**
   * Whether the spotlight applies at all. When false, children render
   * untouched: no wrapper styling, no reserved border, no padding.
   *
   * Named for the spotlight rather than for whatever condition switches it off.
   * The rule that decides it is requirement 5's, and lives with the caller.
   */
  isEnabled?: boolean
  children: ReactNode
}

/**
 * Marks the one section an admin is meant to act on right now, and dims the
 * rest.
 *
 * The inactive state carries a 2px *transparent* border on purpose. It reserves
 * the space the active border occupies, so sections do not shift when the
 * spotlight moves onto them. Simplifying it to `border: none` reintroduces a
 * 2px jump on every Continue.
 *
 * The 2rem inline margin insets the active section, making it narrower than the
 * sections around it. That is deliberate: it reads as a focused panel within
 * the card, and is not an alignment bug to zero out.
 *
 * Dimming is presentation only. A dimmed section stays fully interactive, with
 * no pointer-events change, no `disabled` and no `aria-disabled`, so an admin
 * who scrolls up to fix an earlier answer can do it without leaving the flow.
 * Hover and focus-within restore full opacity, which is what covers a section
 * an admin deliberately returns to: at 0.5 the darkest label composites to
 * 3.22:1, below the 4.5:1 AA requirement, and the opacity needed to pass would
 * make the dimming invisible.
 *
 * Opacity is not the only signal, since the active section also gains a
 * background and a border.
 *
 * Shares `primary.100` with the peek card and differs in border weight: 2px
 * `primary.500` here means "act on this", 1px `primary.200` there reports what
 * just happened. That is the thinnest distinction in the system, so neither
 * should move toward the other.
 */
export const Spotlight = ({
  isActive,
  isEnabled = true,
  children,
}: SpotlightProps): JSX.Element => {
  const prefersReducedMotion = usePrefersReducedMotion()
  // Gated here rather than at each call site: flag-off has to be untouched
  // children everywhere, and that is the same thing isEnabled already means.
  const isRedesign = useIsWorkflowBuilderRedesign()

  if (!isEnabled || !isRedesign) return <>{children}</>

  return (
    <Box
      // The wrapper's presence is the whole of "is the spotlight on", so tests
      // assert on it directly rather than inspecting computed styles.
      data-testid={SPOTLIGHT_TEST_ID}
      bg={isActive ? 'primary.100' : 'transparent'}
      borderRadius={isActive ? '8px' : '0'}
      border="2px solid"
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
