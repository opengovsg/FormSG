import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Text,
} from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'

import { useIsMobile } from '~hooks/useIsMobile'

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
      <ModalHeader color="brand.secondary.700">Downloading...</ModalHeader>
      <ModalBody
        whiteSpace="pre-wrap"
        color="brand.secondary.500"
        textStyle="body-2"
      >
        {children}
        <Text textStyle="subhead-1" mb="0.5rem">
          {downloadPercentage}% completed
        </Text>
        <Progress size="xl" value={downloadPercentage} hasStripe isAnimated />
      </ModalBody>
      <ModalFooter>
        <Button
          colorScheme="critical"
          onClick={onCancel}
          isFullWidth={isMobile}
        >
          Stop download
        </Button>
      </ModalFooter>
    </>
  )
}
