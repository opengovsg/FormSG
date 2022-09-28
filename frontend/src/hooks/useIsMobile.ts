import { useBreakpointValue } from '@chakra-ui/react'

export const useIsMobile = (): boolean => {
  const isMobile = useBreakpointValue({
    base: true,
    xs: true,
    md: false,
  })

  return isMobile ?? false
}
