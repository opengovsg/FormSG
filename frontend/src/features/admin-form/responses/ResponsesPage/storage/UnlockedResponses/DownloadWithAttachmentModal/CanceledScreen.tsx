import {
  Badge,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface CanceledScreenProps {
  onClose: () => void
}

export const CanceledScreen = ({
  onClose,
}: CanceledScreenProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <>
      <ModalCloseButton />
      <ModalHeader color="secondary.700" pr="4.5rem">
        <Wrap shouldWrapChildren direction="row" align="center">
          <Text>Download stopped</Text>
          <Badge w="fit-content" colorScheme="success">
            beta
          </Badge>
        </Wrap>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500">
        Your responses and attachments have not been downloaded successfully.
      </ModalBody>
      <ModalFooter>
        <Button isFullWidth={isMobile} onClick={onClose}>
          Back to responses
        </Button>
      </ModalFooter>
    </>
  )
}
