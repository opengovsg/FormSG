import { useMediaMatch } from 'rooks'

import { BREAKPOINT_VALS } from '~theme/foundations/breakpoints'

export const useIsMobile = (): boolean => {
  const isLargerThanMd = useMediaMatch(`(min-width: ${BREAKPOINT_VALS.md})`)

  return !isLargerThanMd
}
