import { useEffect, useRef } from 'react'
import { Box } from '@chakra-ui/react'

import { LANDING_V5_COLORS } from '../theme/tokens'

/** The press is the page's opening beat, but not its very first frame. */
const PRESS_DELAY_MS = 500

export interface HeroStampWordProps {
  children: string
}

/**
 * The stamped word in the hero headline.
 *
 * Pressed in once on mount, then left alone. Under `prefers-reduced-motion` it
 * is simply present from the start — the word is content, so it must be legible
 * either way; only the press is decoration.
 */
export const HeroStampWord = ({
  children,
}: HeroStampWordProps): JSX.Element => {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(
      () => el.classList.add('lv5-pressed'),
      PRESS_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [])

  return (
    <Box
      ref={ref}
      as="span"
      className="lv5-stamp-word"
      color="landing.blueDeep"
      border="4px solid"
      borderColor="landing.blueDeep"
      borderRadius="10px"
      padding="0 0.16em 0.04em"
      lineHeight={1.05}
      sx={{
        /* Thinner rule on small screens, where 4px against a 44px headline
           reads as a box rather than as inked edges. */
        '@media (max-width: 1024px)': { borderWidth: '2.5px' },
        /* The grain overlay needs a colour to screen against. */
        '--lv5-stamp-ink': LANDING_V5_COLORS.blueDeep,
      }}
    >
      {children}
    </Box>
  )
}
