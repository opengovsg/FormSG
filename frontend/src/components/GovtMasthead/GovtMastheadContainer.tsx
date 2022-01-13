import { useBreakpointValue, useDisclosure } from '@chakra-ui/react'

import { GovtMasthead } from './GovtMasthead'

export const GovtMastheadContainer = (): JSX.Element => {
  const props = useDisclosure()

  const isMobile =
    useBreakpointValue({
      base: true,
      xs: true,
      md: false,
    }) ?? true

  return <GovtMasthead isMobile={isMobile} {...props} />
}
