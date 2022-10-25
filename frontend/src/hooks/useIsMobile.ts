import { useBreakpointValue } from '@chakra-ui/media-query'

export const useIsMobile = (): boolean => {
  const isMobile = useBreakpointValue(
    {
      base: true,
      xs: true,
      md: false,
    },
    { ssr: false, fallback: false },
  )

  return isMobile ?? false
}
