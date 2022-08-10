import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Tabs, useBreakpointValue, useDisclosure } from '@chakra-ui/react'

import { FormStatus } from '~shared/types'

import {
  ADMINFORM_BUILD_SUBROUTE,
  ADMINFORM_PREVIEW_ROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  ROOT_ROUTE,
} from '~constants/routes'

import { ShareFormModal } from '~features/admin-form/share'

import { useAdminForm, useAdminFormCollaborators } from '../../queries'
import CollaboratorModal from '../CollaboratorModal'

import { AdminFormNavbar } from './AdminFormNavbar'

const ADMINFORM_ROUTES = [
  ADMINFORM_BUILD_SUBROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
]

const useAdminFormNavbar = () => {
  const { data: form } = useAdminForm()
  const { pathname } = useLocation()
  const { formId } = useParams()
  const { hasEditAccess, isLoading } = useAdminFormCollaborators()
  const navigate = useNavigate()

  const calcCurrentIndex = useCallback(() => {
    // Truthy check for `r` is necessary as the index route is an empty string
    // which will always return true for includes.
    const index = ADMINFORM_ROUTES.findIndex((r) => r && pathname.includes(r))
    return index === -1 ? 0 : index
  }, [pathname])

  const [tabIndex, setTabIndex] = useState(calcCurrentIndex())

  /**
   * Update tabIndex whenever pathname changes, so browser navigation will also
   * update the active tab.
   */
  useEffect(() => {
    setTabIndex(calcCurrentIndex())
  }, [pathname, calcCurrentIndex])

  const handleBackToDashboard = useCallback(
    (): void => navigate(ROOT_ROUTE),
    [navigate],
  )

  const handlePreviewForm = useCallback((): void => {
    window.open(
      `${window.location.origin}${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_PREVIEW_ROUTE}`,
    )
  }, [formId])

  const handleTabsChange = useCallback(
    (index: number) => navigate(ADMINFORM_ROUTES[index]),
    [navigate],
  )

  const collaboratorModalDisclosure = useDisclosure()
  const shareFormModalDisclosure = useDisclosure()

  return {
    tabIndex,
    handleTabsChange,
    handleBackToDashboard,
    handlePreviewForm,
    form,
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
    tabIndex,
    handleTabsChange,
    handleBackToDashboard,
    handlePreviewForm,
    collaboratorModalDisclosure,
    shareFormModalDisclosure,
    form,
    viewOnly,
  } = useAdminFormNavbar()

  const responsiveVariant = useBreakpointValue({
    base: 'line-dark',
    xs: 'line-dark',
    lg: 'line-light',
  })

  return (
    <>
      <CollaboratorModal
        isOpen={collaboratorModalDisclosure.isOpen}
        onClose={collaboratorModalDisclosure.onClose}
      />
      <ShareFormModal
        isOpen={shareFormModalDisclosure.isOpen}
        onClose={shareFormModalDisclosure.onClose}
        formId={form?._id}
        isFormPrivate={form?.status === FormStatus.Private}
      />
      <Tabs
        variant={responsiveVariant}
        isLazy
        defaultIndex={tabIndex}
        index={tabIndex}
        onChange={handleTabsChange}
      >
        <AdminFormNavbar
          formInfo={form}
          viewOnly={viewOnly}
          handleBackButtonClick={handleBackToDashboard}
          handleAddCollabButtonClick={collaboratorModalDisclosure.onOpen}
          handlePreviewFormButtonClick={handlePreviewForm}
          handleShareButtonClick={shareFormModalDisclosure.onOpen}
        />
      </Tabs>
    </>
  )
}
