// Context contains the current acted upon row.
// Mostly used by actions such as duplication of form from the workspace row.

import { createContext, useContext, useState } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { AdminDashboardFormMetaDto, FormStatus } from '~shared/types'

import { ShareFormModal } from '~features/admin-form/share'

import { DeleteFormModal } from '../DeleteFormModal/DeleteFormModal'
import { DuplicateFormModal } from '../DuplicateFormModal'

interface WorkspaceRowsContextReturn {
  activeFormMeta?: AdminDashboardFormMetaDto
  onOpenDupeFormModal: (meta?: AdminDashboardFormMetaDto) => void
  onOpenShareFormModal: (meta?: AdminDashboardFormMetaDto) => void
  onOpenDeleteFormModal: (meta?: AdminDashboardFormMetaDto) => void
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
  const deleteFormModalDisclosure = useDisclosure()

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

  const onOpenDeleteFormModal = (meta?: AdminDashboardFormMetaDto) => {
    setActiveFormMeta(meta)
    if (meta) {
      deleteFormModalDisclosure.onOpen()
    }
  }

  return (
    <WorkspaceRowsContext.Provider
      value={{
        activeFormMeta,
        onOpenDupeFormModal,
        onOpenShareFormModal,
        onOpenDeleteFormModal,
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
      <DeleteFormModal
        isOpen={deleteFormModalDisclosure.isOpen}
        onClose={deleteFormModalDisclosure.onClose}
        formsToDelete={activeFormMeta ? [activeFormMeta] : []}
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
