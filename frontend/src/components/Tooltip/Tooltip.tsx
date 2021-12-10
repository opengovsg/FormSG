import { useState } from 'react'
import {
  Box,
  CSSObject,
  Tooltip as ChakraTooltip,
  TooltipProps as ChakraTooltipProps,
  VisuallyHidden,
} from '@chakra-ui/react'

export interface TooltipProps extends ChakraTooltipProps {
  /**
   * Text which appears on hover/focus.
   */
  label: string
  /**
   * Styles for the container which wraps the children.
   */
  wrapperStyles?: CSSObject
}

export const Tooltip = ({
  children,
  wrapperStyles,
  ...props
}: TooltipProps): JSX.Element => {
  // ChakraTooltip does not work on mobile by design. (see
  // https://github.com/chakra-ui/chakra-ui/issues/2691)
  // Hence adapt the tooltip to open when clicked on mobile
  const [isLabelOpen, setIsLabelOpen] = useState(!!props.isOpen)
  return (
    <>
      <ChakraTooltip {...props} hasArrow isOpen={isLabelOpen}>
        <Box
          as="span"
          onMouseEnter={() => setIsLabelOpen(true)}
          onMouseLeave={() => setIsLabelOpen(false)}
          onClick={() => setIsLabelOpen((currentState) => !currentState)}
          verticalAlign="middle"
          __css={wrapperStyles}
        >
          {children}
        </Box>
      </ChakraTooltip>
      <VisuallyHidden>{props.label}</VisuallyHidden>
    </>
  )
}
