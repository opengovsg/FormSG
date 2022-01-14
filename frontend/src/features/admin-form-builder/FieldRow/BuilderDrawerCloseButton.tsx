import { BiX } from 'react-icons/bi'
import { CloseButton } from '@chakra-ui/react'

import { useBuilderDrawer } from '../BuilderDrawerContext'

export const BuilderDrawerCloseButton = (): JSX.Element => {
  const { handleClose } = useBuilderDrawer()

  return (
    <CloseButton
      zIndex={1}
      fontSize="1.5rem"
      w="1.5rem"
      h="1.5rem"
      variant="clear"
      colorScheme="neutral"
      children={<BiX />}
      onClick={handleClose}
    />
  )
}
