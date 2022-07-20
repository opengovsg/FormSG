import {
  Modal,
  ModalContent,
  ModalOverlay,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ProgressModalContent } from './ProgressModalContent'

export interface ProgressModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  downloadPercentage: number
  isDownloading: boolean
  children: React.ReactNode
}

export const ProgressModal = ({
  isOpen,
  isDownloading,
  onClose,
  downloadPercentage,
  children,
}: ProgressModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  return (
    <Modal
      size={modalSize}
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ProgressModalContent
          isDownloading={isDownloading}
          onClose={onClose}
          children={children}
          downloadPercentage={downloadPercentage}
        />
      </ModalContent>
    </Modal>
  )
}
