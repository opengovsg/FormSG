import { useEffect } from 'react'
import { Modal, ModalContent, UseDisclosureReturn } from '@chakra-ui/react'

import { AdminFeedbackModalContent } from './AdminFeedbackModalContent'

export type AdminFeedbackModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> & { onOpen: () => void }

export const AdminFeedbackModal = ({
  isOpen,
  onClose,
  onOpen,
}: AdminFeedbackModalProps): JSX.Element => {
  useEffect(() => {
    if (isOpen) onOpen()
  }, [onOpen, isOpen])

  return (
    <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
      <ModalContent bottom="1.5rem" position="absolute" margin="auto" w="35.5">
        <AdminFeedbackModalContent onClose={onClose} />
      </ModalContent>
    </Modal>
  )
}
