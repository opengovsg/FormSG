import { Tooltip as ChakraTooltip, TooltipProps } from '@chakra-ui/react'

export const Tooltip = (props: TooltipProps): JSX.Element => (
  <ChakraTooltip {...props} hasArrow />
)
