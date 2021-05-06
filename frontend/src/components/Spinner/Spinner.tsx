import { usePrefersReducedMotion } from '@chakra-ui/media-query'
import { chakra, keyframes } from '@chakra-ui/system'
import VisuallyHidden from '@chakra-ui/visually-hidden'
import { FC, useMemo } from 'react'
import { BiLoader } from 'react-icons/bi'

export interface SpinnerProps {
  /**
   * The color of the spinner
   */
  color?: string
  /**
   * The speed of the spinner.
   * @example
   * ```jsx
   * <Spinner speed="0.2s"/>
   * ```
   */
  speed?: string
  /**
   * For accessibility, it is important to add a fallback loading text.
   * This text will be visible to screen readers.
   */
  label?: string

  /**
   * Font size of the spinner.
   */
  fontSize?: string
}

const spin = keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(360deg)',
  },
})

export const Spinner: FC<SpinnerProps> = ({
  speed = '2.5s',
  color = 'inherit',
  label = 'Loading...',
  fontSize = '1rem',
}) => {
  const prefersReducedMotion = usePrefersReducedMotion()

  const animation = useMemo(
    () =>
      prefersReducedMotion ? undefined : `${spin} ${speed} linear infinite`,
    [prefersReducedMotion, speed],
  )

  return (
    <chakra.div animation={animation} color={color}>
      {label && <VisuallyHidden>{label}</VisuallyHidden>}
      <BiLoader fontSize={fontSize} />
    </chakra.div>
  )
}
