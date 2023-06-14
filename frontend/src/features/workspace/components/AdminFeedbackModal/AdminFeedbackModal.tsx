import { useEffect } from 'react'
import { Modal, ModalContent, UseDisclosureReturn } from '@chakra-ui/react'

import { AdminFeedbackModalContent } from './AdminFeedbackModalContent'

export type AdminFeedbackModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> & { onMount: () => void }

export const AdminFeedbackModal = ({
  isOpen,
  onClose,
  onMount,
}: AdminFeedbackModalProps): JSX.Element => {
  useEffect(() => onMount(), [onMount])

  return (
    <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
      <ModalContent bottom="1.5rem" position="absolute" margin="auto" w="35.5">
        <AdminFeedbackModalContent onClose={onClose} />
      </ModalContent>
    </Modal>
  )
}
