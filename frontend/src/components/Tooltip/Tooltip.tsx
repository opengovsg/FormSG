import {
  Tooltip as ChakraTooltip,
  TooltipProps as ChakraTooltipProps,
} from '@chakra-ui/react'

export type TooltipProps = ChakraTooltipProps

export const Tooltip = (props: TooltipProps): JSX.Element => {
  return <ChakraTooltip hasArrow {...props} />
}
