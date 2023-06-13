import { Modal, ModalContent, UseDisclosureReturn } from '@chakra-ui/react'

import { AdminFeedbackModalContent } from './AdminFeedbackModalContent'

export type AdminFeedbackModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const AdminFeedbackModal = ({
  isOpen,
  onClose,
}: AdminFeedbackModalProps): JSX.Element => {
  return (
    <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
      <ModalContent bottom="1.5rem" position="absolute" margin="auto" w="35.5">
        <AdminFeedbackModalContent />
      </ModalContent>
    </Modal>
  )
}
