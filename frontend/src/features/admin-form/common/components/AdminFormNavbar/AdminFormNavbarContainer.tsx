import { useParams } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'

import { FormStatus } from '~shared/types'

import { ADMINFORM_PREVIEW_ROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { ShareFormModal } from '~features/admin-form/share'

import { useAdminForm, useAdminFormCollaborators } from '../../queries'
import CollaboratorModal from '../CollaboratorModal'

import { AdminFormNavbar } from './AdminFormNavbar'

const useAdminFormNavbar = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { data: form } = useAdminForm()
  const { hasEditAccess, isLoading } = useAdminFormCollaborators(formId)
  const collaboratorModalDisclosure = useDisclosure()
  const shareFormModalDisclosure = useDisclosure()

  return {
    form,
    formId,
    collaboratorModalDisclosure,
    shareFormModalDisclosure,
    viewOnly: !isLoading && !hasEditAccess,
  }
}

/**
 * @precondition Must have AdminFormTabProvider parent due to usage of TabList and Tab.
 */
export const AdminFormNavbarContainer = (): JSX.Element => {
  const {
    collaboratorModalDisclosure,
    shareFormModalDisclosure,
    form,
    formId,
    viewOnly,
  } = useAdminFormNavbar()

  return (
    <>
      <CollaboratorModal
        isOpen={collaboratorModalDisclosure.isOpen}
        onClose={collaboratorModalDisclosure.onClose}
        formId={formId}
      />
      <ShareFormModal
        isOpen={shareFormModalDisclosure.isOpen}
        onClose={shareFormModalDisclosure.onClose}
        formId={form?._id}
        isFormPrivate={form?.status === FormStatus.Private}
      />
      <AdminFormNavbar
        formInfo={form}
        viewOnly={viewOnly}
        previewFormLink={`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_PREVIEW_ROUTE}`}
        handleAddCollabButtonClick={collaboratorModalDisclosure.onOpen}
        handleShareButtonClick={shareFormModalDisclosure.onOpen}
      />
    </>
  )
}
