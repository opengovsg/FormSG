import { useDisclosure } from '@chakra-ui/react'

import { GovtMasthead } from './GovtMasthead'

export const GovtMastheadContainer = (): JSX.Element => {
  const props = useDisclosure()
  return <GovtMasthead {...props} />
}
