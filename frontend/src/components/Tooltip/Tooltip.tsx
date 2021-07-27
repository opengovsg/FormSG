import { Tooltip as ChakraTooltip, TooltipProps } from '@chakra-ui/react'

export const Tooltip = (props: TooltipProps) => (
  <ChakraTooltip {...props} hasArrow />
)
