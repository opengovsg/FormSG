// Context contains the current acted upon row.
// Mostly used by actions such as duplication of form from the workspace row.

import { createContext, useContext, useState } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { AdminDashboardFormMetaDto, FormStatus } from '~shared/types'

import CollaboratorModal from '~features/admin-form/common/components/CollaboratorModal'
import { ShareFormModal } from '~features/admin-form/share'

import { DuplicateFormModal } from '../DuplicateFormModal'

interface WorkspaceRowsContextReturn {
  activeFormMeta?: AdminDashboardFormMetaDto
  onOpenDupeFormModal: (meta?: AdminDashboardFormMetaDto) => void
  onCloseDupeFormModal: () => void
  onOpenShareFormModal: (meta?: AdminDashboardFormMetaDto) => void
  onOpenCollabModal: (meta?: AdminDashboardFormMetaDto) => void
}

const WorkspaceRowsContext = createContext<WorkspaceRowsContextReturn | null>(
  null,
)

export const WorkspaceRowsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [activeFormMeta, setActiveFormMeta] =
    useState<AdminDashboardFormMetaDto>()

  const dupeFormModalDisclosure = useDisclosure()
  const shareFormModalDisclosure = useDisclosure()
  const collabModalDisclosure = useDisclosure()

  const onOpenDupeFormModal = (meta?: AdminDashboardFormMetaDto) => {
    setActiveFormMeta(meta)
    if (meta) {
      dupeFormModalDisclosure.onOpen()
    }
  }

  const onOpenShareFormModal = (meta?: AdminDashboardFormMetaDto) => {
    setActiveFormMeta(meta)
    if (meta) {
      shareFormModalDisclosure.onOpen()
    }
  }

  const onOpenCollabModal = (meta?: AdminDashboardFormMetaDto) => {
    setActiveFormMeta(meta)
    if (meta) {
      collabModalDisclosure.onOpen()
    }
  }

  return (
    <WorkspaceRowsContext.Provider
      value={{
        activeFormMeta,
        onOpenDupeFormModal,
        onOpenShareFormModal,
        onCloseDupeFormModal: dupeFormModalDisclosure.onClose,
        onOpenCollabModal,
      }}
    >
      <DuplicateFormModal
        isOpen={dupeFormModalDisclosure.isOpen}
        onClose={dupeFormModalDisclosure.onClose}
      />
      <ShareFormModal
        isOpen={shareFormModalDisclosure.isOpen}
        formId={activeFormMeta?._id}
        onClose={shareFormModalDisclosure.onClose}
        isFormPrivate={activeFormMeta?.status === FormStatus.Private}
      />
      <CollaboratorModal
        isOpen={collabModalDisclosure.isOpen}
        formId={activeFormMeta?._id}
        onClose={collabModalDisclosure.onClose}
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
