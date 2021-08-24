import { useState } from 'react'
import { Box, Tooltip as ChakraTooltip, TooltipProps } from '@chakra-ui/react'

export const Tooltip = ({ children, ...props }: TooltipProps): JSX.Element => {
  // ChakraTooltip does not work on mobile by design. (see
  // https://github.com/chakra-ui/chakra-ui/issues/2691)
  // Hence adapt the tooltip to open when clicked on mobile
  const [isLabelOpen, setIsLabelOpen] = useState(!!props.isOpen)
  return (
    <ChakraTooltip {...props} hasArrow isOpen={isLabelOpen}>
      <Box
        as="span"
        onMouseEnter={() => setIsLabelOpen(true)}
        onMouseLeave={() => setIsLabelOpen(false)}
        onClick={() => setIsLabelOpen((currentState) => !currentState)}
      >
        {children}
      </Box>
    </ChakraTooltip>
  )
}
