import { GoThumbsdown, GoThumbsup } from 'react-icons/go'
import { ModalBody } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

export const AdminFeedbackModalContent = () => {
  return (
    <ModalBody textStyle="h6" my="1rem">
      How was your form building experience?
      <IconButton
        variant="clear"
        icon={<GoThumbsup />}
        colorScheme="theme-blue"
        aria-label="Good"
        ml="2.2rem"
      />
      <IconButton
        variant="clear"
        icon={<GoThumbsdown />}
        colorScheme="theme-red"
        aria-label="Bad"
        ml="2.2rem"
      />
    </ModalBody>
  )
}
