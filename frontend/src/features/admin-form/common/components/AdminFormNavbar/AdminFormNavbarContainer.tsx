import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'

import { FormStatus } from '~shared/types'

import {
  ADMINFORM_PREVIEW_ROUTE,
  ADMINFORM_ROUTE,
  DASHBOARD_ROUTE,
} from '~constants/routes'

import { ShareFormModal } from '~features/admin-form/share'

import { useAdminForm, useAdminFormCollaborators } from '../../queries'
import CollaboratorModal from '../CollaboratorModal'

import { AdminFormNavbar } from './AdminFormNavbar'

const useAdminFormNavbar = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { data: form } = useAdminForm()
  const { hasEditAccess, isLoading } = useAdminFormCollaborators(formId)
  const navigate = useNavigate()

  const handleBackToDashboard = useCallback(
    (): void => navigate(DASHBOARD_ROUTE),
    [navigate],
  )

  const handlePreviewForm = useCallback((): void => {
    window.open(
      `${window.location.origin}${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_PREVIEW_ROUTE}`,
    )
  }, [formId])

  const collaboratorModalDisclosure = useDisclosure()
  const shareFormModalDisclosure = useDisclosure()

  return {
    handleBackToDashboard,
    handlePreviewForm,
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
    handleBackToDashboard,
    handlePreviewForm,
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
        handleBackButtonClick={handleBackToDashboard}
        handleAddCollabButtonClick={collaboratorModalDisclosure.onOpen}
        handlePreviewFormButtonClick={handlePreviewForm}
        handleShareButtonClick={shareFormModalDisclosure.onOpen}
      />
    </>
  )
}
