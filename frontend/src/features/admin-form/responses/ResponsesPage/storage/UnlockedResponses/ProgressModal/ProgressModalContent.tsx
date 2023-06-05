import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { ProgressModalProps } from './ProgressModal'

type ProgressModalContentProps = Pick<
  ProgressModalProps,
  'children' | 'downloadPercentage' | 'onCancel'
>

export const ProgressModalContent = ({
  children,
  downloadPercentage,
  onCancel,
}: ProgressModalContentProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <>
      <ModalHeader color="secondary.700">Downloading...</ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="secondary.500" textStyle="body-2">
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
