import { useCallback, useEffect, useState } from 'react'
import {
  matchPath,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { Tabs, useBreakpointValue } from '@chakra-ui/react'

import {
  ADMINFORM_BUILD_SUBROUTE,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  ROOT_ROUTE,
} from '~constants/routes'

import { useAdminForm } from '../../queries'

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

  const handleAddCollaborator = useCallback((): void => {
    console.log('add collab button clicked')
  }, [])

  const handlePreviewForm = useCallback((): void => {
    console.log('preview form button clicked')
  }, [])

  const handleShareForm = useCallback((): void => {
    console.log('share form button clicked')
  }, [])

  const handleTabsChange = useCallback(
    (index: number) => navigate(ADMINFORM_ROUTES[index]),
    [navigate],
  )

  return {
    tabIndex,
    handleTabsChange,
    handleBackToDashboard,
    handleAddCollaborator,
    handlePreviewForm,
    handleShareForm,
    form,
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
    handleAddCollaborator,
    handlePreviewForm,
    handleShareForm,
    form,
  } = useAdminFormNavbar()

  const responsiveVariant = useBreakpointValue({
    base: 'line-dark',
    xs: 'line-dark',
    lg: 'line-light',
  })

  return (
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
        handleAddCollabButtonClick={handleAddCollaborator}
        handlePreviewFormButtonClick={handlePreviewForm}
        handleShareButtonClick={handleShareForm}
      />
    </Tabs>
  )
}
