// Context contains the current acted upon row.
// Mostly used by actions such as duplication of form from the workspace row.

import { createContext, useContext, useState } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import CreateFormModal from '../CreateFormModal'

interface WorkspaceRowsContextReturn {
  activeFormId?: string
  onOpenDupeFormModal: (id?: string) => void
  onCloseDupeFormModal: () => void
}

const WorkspaceRowsContext = createContext<WorkspaceRowsContextReturn | null>(
  null,
)

export const WorkspaceRowsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [activeFormId, setActiveFormId] = useState<string>()

  const dupeFormModalDisclosure = useDisclosure()

  const handleOpenDupeFormModal = (id?: string) => {
    setActiveFormId(id)
    if (id) {
      dupeFormModalDisclosure.onOpen()
    }
  }

  return (
    <WorkspaceRowsContext.Provider
      value={{
        activeFormId,
        onOpenDupeFormModal: handleOpenDupeFormModal,
        onCloseDupeFormModal: dupeFormModalDisclosure.onClose,
      }}
    >
      <CreateFormModal
        isOpen={dupeFormModalDisclosure.isOpen}
        onClose={dupeFormModalDisclosure.onClose}
      />
      {children}
    </WorkspaceRowsContext.Provider>
  )
}

export const useWorkspaceRowsContext = () => {
  const context = useContext(WorkspaceRowsContext)
  if (context === null) {
    throw new Error(
      'useWorkspaceRowsContext must be used within a WorkspaceRowsProvider',
    )
  }
  return context
}
