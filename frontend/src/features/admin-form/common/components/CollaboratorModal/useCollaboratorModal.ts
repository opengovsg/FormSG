import { useDisclosure } from '@chakra-ui/react'

type UseCollaboratorModalReturn = {
  isCollaboratorModalOpen: boolean
  onOpenCollaboratorModal: () => void
  onCloseCollaboratorModal: () => void
}

export const useCollaboratorModal = (): UseCollaboratorModalReturn => {
  const { onOpen, onClose, isOpen } = useDisclosure()

  return {
    onOpenCollaboratorModal: onOpen,
    onCloseCollaboratorModal: onClose,
    isCollaboratorModalOpen: isOpen,
  }
}
