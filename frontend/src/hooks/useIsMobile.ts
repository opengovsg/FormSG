import { useMediaQuery } from '@chakra-ui/react'

import { BREAKPOINT_VALS } from '~theme/foundations/breakpoints'

export const useIsMobile = (): boolean => {
  const [isLargerThanMd] = useMediaQuery(`(min-width: ${BREAKPOINT_VALS.md})`)

  return !isLargerThanMd
}
