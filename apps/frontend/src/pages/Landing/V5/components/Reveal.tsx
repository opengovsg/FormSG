import { Box, BoxProps } from '@chakra-ui/react'

import { useReveal } from '../hooks/useReveal'

/**
 * Wraps a block so it rises into place the first time it is scrolled to.
 *
 * Nearly every use site on this page is "reveal this whole block", so this
 * saves repeating the hook, the class and the ref wiring at each one. Takes any
 * Box prop, including `as`, so a revealed element can still be the right tag:
 * `<Reveal as="section">`.
 */
export const Reveal = ({
  className,
  children,
  ...props
}: BoxProps): JSX.Element => {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Box
      ref={ref}
      className={['lv5-reveal', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </Box>
  )
}
