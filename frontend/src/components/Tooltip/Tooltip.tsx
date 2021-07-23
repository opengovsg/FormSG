import { TouchEvent, useRef, useState } from 'react'
import {
  Box,
  Tooltip as ChakraTooltip,
  TooltipProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { TOOLTIP_THEME_KEY } from '~/theme/components/Tooltip'

export const Tooltip = ({ children, ...props }: TooltipProps): JSX.Element => {
  // component is controlled in mobile mode
  const [isOpen, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const handleTouch = () => {
    if (isOpen) {
      wrapperRef.current?.blur()
    } else {
      wrapperRef.current?.focus()
    }
    setOpen((isOpen) => !isOpen)
  }
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault() // prevent blurring element after focus
  }

  const styles = useMultiStyleConfig(TOOLTIP_THEME_KEY, props)

  return (
    <ChakraTooltip {...props} hasArrow sx={styles.tooltip}>
      <Box
        tabIndex={0}
        ref={wrapperRef}
        onTouchStart={handleTouch}
        onTouchEnd={handleTouchEnd}
        sx={styles.wrapper}
      >
        {children}
      </Box>
    </ChakraTooltip>
  )
}
