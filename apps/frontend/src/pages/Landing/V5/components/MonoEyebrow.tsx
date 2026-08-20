import { Text, TextProps } from '@chakra-ui/react'

/**
 * The page's recurring label voice: small, wide-tracked, monospaced caps.
 *
 * Used for section eyebrows, clearance markers and the placeholder text inside
 * the illustrations. Defaults to the muted grey; pass `color` where the
 * surrounding surface needs something fainter.
 */
export const MonoEyebrow = ({ children, ...props }: TextProps): JSX.Element => (
  <Text textStyle="landing.monoEyebrow" color="landing.muted" {...props}>
    {children}
  </Text>
)
