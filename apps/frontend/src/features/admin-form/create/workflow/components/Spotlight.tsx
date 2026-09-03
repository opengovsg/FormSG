import { Children, ReactNode } from 'react'
import { Box, Divider, Stack, usePrefersReducedMotion } from '@chakra-ui/react'

import { useIsWorkflowBuilderRedesign } from '../hooks/useIsWorkflowBuilderRedesign'

export const SPOTLIGHT_TEST_ID = 'workflow-spotlight'

/**
 * Clearance between a section's content and each of its boundary lines.
 *
 * `1.5rem` because that is what `EditStepBlock`'s `Stack spacing="1.5rem"`
 * already puts on both sides of every sibling `<Divider />`. The rhythm is
 * content-to-line, not content-to-content, so halving this to `0.75rem` on the
 * theory that two bands share a gap makes the whole card tighter than it is
 * today.
 *
 * This is not padding that insets the section. Content keeps the size and
 * position it had; the band simply owns whitespace the parent Stack used to.
 * A container that had `2rem` of its own padding above the first section should
 * drop that to `0.5rem`, since the band now contributes the other `1.5rem`.
 */
const BAND_GAP = '1.5rem'

/** How much the active band grows. Design's "hovers upwards", as a 2% enlargement. */
const ACTIVE_SCALE = 'scale(1.02)'

export interface SpotlightProps {
  /** This section is the current decision. */
  isActive: boolean
  /**
   * Whether the spotlight applies at all. When false, children render
   * untouched: no wrapper, no band, no boundary line.
   *
   * Named for the spotlight rather than for whatever condition switches it off.
   * The rule that decides it is requirement 5's, and lives with the caller.
   */
  isEnabled?: boolean
  /**
   * Draws this band's top boundary: the line that used to be a sibling
   * `<Divider />`. Owned by the band rather than the parent so the active
   * outline can be drawn on the line rather than inside it.
   *
   * `SpotlightGroup` decides this. Callers rendering a lone band leave it off.
   */
  hasTopBorder?: boolean
  /**
   * Draws this band's bottom boundary. Only the last band in a run needs one,
   * since every other band's lower boundary is the next band's top border.
   */
  hasBottomBorder?: boolean
  children: ReactNode
}

/**
 * One section of a step card as a band that runs boundary to boundary, lit when
 * it is the current decision and dimmed when it is not.
 *
 * The active band is enlarged by 2% rather than inset and padded. An earlier
 * version added `2rem` of inline margin and vertical padding on activation,
 * which made the lit section narrower than its neighbours and squeezed its
 * contents. Design rejected that: the section is meant to read as lifting off
 * the card at full size, not as a smaller panel within it.
 *
 * The 2% scale is uniform, so the band ends up wider than the card and crosses
 * the card's own border on both sides. That is the intended "hover", and no
 * ancestor clips it. Do not clamp it back to the card width.
 *
 * Two properties make the enlargement free of layout cost, which matters
 * because the spotlight moves on every Continue and any reflow reads as a jump:
 *
 * - `transform` does not participate in layout, so neighbours never move.
 * - the ring is an `outline`, not a `border`, so it occupies no space and needs
 *   no transparent placeholder reserving room for it.
 *
 * The top boundary line is the one thing that could still shift, so it is
 * always a 1px border and only its colour changes.
 *
 * The band is positioned with a raised `zIndex` when active. That is
 * load-bearing rather than cosmetic: the enlarged band has to paint over the
 * boundary line of the section below it, which belongs to that sibling.
 *
 * Dimming is presentation only. A dimmed section stays fully interactive, with
 * no pointer-events change, no `disabled` and no `aria-disabled`, so an admin
 * who scrolls up to fix an earlier answer can do it without leaving the flow.
 * Hover and focus-within restore full opacity, which is what covers a section
 * an admin deliberately returns to: at 0.5 the darkest label composites to
 * 3.22:1, below the 4.5:1 AA requirement, and the opacity needed to pass would
 * make the dimming invisible.
 *
 * Opacity is not the only signal, since the active band also gains a background
 * and an outline.
 *
 * Shares `primary.100` with the peek card and differs in border weight: 2px
 * `primary.500` here means "act on this", 1px `primary.200` there reports what
 * just happened. That is the thinnest distinction in the system, so neither
 * should move toward the other.
 */
export const Spotlight = ({
  isActive,
  isEnabled = true,
  hasTopBorder = false,
  hasBottomBorder = false,
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
      py={BAND_GAP}
      bg={isActive ? 'primary.100' : 'transparent'}
      borderRadius={isActive ? '8px' : '0'}
      // Always 1px on both edges, colour-switched. Toggling a border itself
      // would move the section by a pixel every time the spotlight arrived or
      // left, and every band carries both so their heights stay identical.
      borderTop="1px solid"
      borderTopColor={hasTopBorder ? 'neutral.300' : 'transparent'}
      borderBottom="1px solid"
      borderBottomColor={hasBottomBorder ? 'neutral.300' : 'transparent'}
      // An outline, not a border: drawn outside the box at zero layout cost, so
      // it can sit on the boundary lines instead of inside them.
      //
      // Colour-switched, and deliberately not `outline="none"` when inactive:
      // the shorthand loses to the `outlineColor` longhand beside it, which
      // painted a blue ring on every band and left a lavender rectangle around
      // the whole group at 0.5 opacity. Costs nothing to leave the outline in
      // place, since it never occupies layout.
      //
      // Has to be this pair of props. Chakra maps `outline` and `outlineColor`
      // but not `outlineWidth` or `outlineStyle`, which React forwards to the
      // DOM as attributes and which never become CSS at all.
      outline="2px solid"
      outlineColor={isActive ? 'primary.500' : 'transparent'}
      opacity={isActive ? 1 : 0.5}
      _hover={{ opacity: 1 }}
      _focusWithin={{ opacity: 1 }}
      transform={
        // A static enlargement rather than an animation, so reduced motion
        // drops the transition and keeps the state. Without the scale the band
        // would stop covering the line below it.
        isActive ? ACTIVE_SCALE : 'none'
      }
      transformOrigin="center"
      position="relative"
      zIndex={isActive ? 1 : 0}
      transition={
        prefersReducedMotion
          ? 'none'
          : 'opacity 0.3s ease, background 0.3s ease, outline-color 0.3s ease, transform 0.3s ease'
      }
    >
      {children}
    </Box>
  )
}

export interface SpotlightGroupProps {
  /**
   * Which section is the current decision, zero-based, or `null` for none.
   * Zero-based to match `WorkflowContent`'s `stepNumber={i}` and the workflow
   * store.
   */
  activeIndex: number | null
  /** Passed through to every band. See `SpotlightProps.isEnabled`. */
  isEnabled?: boolean
  /** One child per section. */
  children: ReactNode
}

/**
 * The run of sections a spotlight moves through, and the owner of every
 * boundary line in that run.
 *
 * A band cannot own both its lines: the line below section N is the line above
 * section N+1. So the lines live here, where the active index is known, and the
 * two lines the active outline is drawn on are suppressed. Without that
 * suppression a grey hairline shows a pixel inside the blue outline.
 *
 * That includes the line *below the last section*, which is why this renders a
 * trailing boundary and the caller must not. The last section's lower boundary
 * is the divider above the Save/Continue row, and if the container owned that
 * gap the last band could not reach its own line: the outline would float
 * `1.5rem` above it while every other section's sat on it.
 *
 * Only the spotlit sections belong inside. The Save/Continue row stays outside
 * and below the trailing boundary: the buttons are the way forward and dimming
 * them would look unavailable.
 *
 * When the spotlight is off, this renders the pre-redesign structure, sibling
 * dividers at the same `1.5rem` clearance and the same trailing divider,
 * because flag-off has to leave the card as it was.
 *
 * Both states put `1.5rem` inside the group's own top edge and above its
 * trailing line, so a card is laid out identically whichever way the flag
 * falls. A container that had `2rem` above its first section drops that to
 * `0.5rem`, since the group now contributes the rest.
 */
export const SpotlightGroup = ({
  activeIndex,
  isEnabled = true,
  children,
}: SpotlightGroupProps): JSX.Element => {
  const isRedesign = useIsWorkflowBuilderRedesign()

  const sections = Children.toArray(children)

  if (!isEnabled || !isRedesign) {
    return (
      // `pt` matches the clearance a band contributes above the first section,
      // so a card is laid out identically whichever way the flag falls and the
      // container needs only one set of padding values.
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
            // The first section's upper boundary is the card edge, not a line.
            hasTopBorder={i > 0 && !isActive && !isBelowActive}
            // Only the last band draws its own lower boundary, and not when it
            // is the lit one: there the outline is already on that line.
            hasBottomBorder={i === sections.length - 1 && !isActive}
          >
            {section}
          </Spotlight>
        )
      })}
    </Stack>
  )
}
