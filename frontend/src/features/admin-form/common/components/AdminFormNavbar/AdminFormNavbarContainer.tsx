import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, useBreakpointValue, useDisclosure } from '@chakra-ui/react'

import {
  ADMINFORM_BUILD_SUBROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  ROOT_ROUTE,
} from '~constants/routes'

import { ShareFormModal } from '~features/admin-form/share'

import { useAdminForm } from '../../queries'
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
    console.log('preview form button clicked')
  }, [])

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
          handleBackButtonClick={handleBackToDashboard}
          handleAddCollabButtonClick={collaboratorModalDisclosure.onOpen}
          handlePreviewFormButtonClick={handlePreviewForm}
          handleShareButtonClick={shareFormModalDisclosure.onOpen}
        />
      </Tabs>
    </>
  )
}
