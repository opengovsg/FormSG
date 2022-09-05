import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import { usePrompt } from '~hooks/usePrompt'
import Button from '~components/Button'

import { ProgressModalProps } from './ProgressModal'

type ProgressModalContentProps = Pick<
  ProgressModalProps,
  'children' | 'downloadPercentage' | 'onCancel' | 'isDownloading'
>

export const ProgressModalContent = ({
  children,
  downloadPercentage,
  isDownloading,
  onCancel,
}: ProgressModalContentProps): JSX.Element => {
  const isMobile = useIsMobile()

  usePrompt(
    'Are you sure you want to navigate away from this page? Navigating away from this page will stop the download.',
    isDownloading,
  )

  return (
    <>
      <ModalHeader color="secondary.700">Downloading...</ModalHeader>
      <ModalBody whiteSpace="pre-line" color="secondary.500" textStyle="body-2">
        {children}
        <Text textStyle="subhead-1" mb="0.5rem">
          {downloadPercentage}% completed
        </Text>
        <Progress size="xl" value={downloadPercentage} hasStripe isAnimated />
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="danger" onClick={onCancel} isFullWidth={isMobile}>
          Stop download
        </Button>
      </ModalFooter>
    </>
  )
}
