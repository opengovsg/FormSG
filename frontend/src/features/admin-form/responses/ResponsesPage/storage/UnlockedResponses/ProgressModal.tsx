import { useMemo } from 'react'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { usePrompt } from '~hooks/usePrompt'
import Button from '~components/Button'

export interface ProgressModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  responsesCount: number
  progress: number
  isDownloading: boolean
}

export const ProgressModal = ({
  isOpen,
  isDownloading,
  onClose,
  responsesCount,
  progress,
}: ProgressModalProps): JSX.Element => {
  const percentage = useMemo(() => {
    return Math.floor((progress / responsesCount) * 100)
  }, [progress, responsesCount])

  usePrompt(
    'Are you sure you want to navigate away from this page? Navigating away from this page will stop the download.',
    isDownloading,
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="secondary.700">Downloading...</ModalHeader>
        <ModalBody
          whiteSpace="pre-line"
          color="secondary.500"
          textStyle="body-2"
        >
          <Text mb="1rem">
            <b>{responsesCount.toLocaleString()}</b> responses are being
            processed. Navigating away from this page will stop the download.
          </Text>

          <Text textStyle="subhead-1" mb="0.5rem">
            {percentage}% completed
          </Text>
          <Progress size="xl" value={percentage} />
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button colorScheme="danger" onClick={onClose}>
              Stop download
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
