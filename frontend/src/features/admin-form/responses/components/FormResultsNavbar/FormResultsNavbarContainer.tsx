import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs } from '@chakra-ui/react'

import {
  RESULTS_FEEDBACK_SUBROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'

import { FormResultsNavbar } from './FormResultsNavbar'

const RESULTS_ROUTES = [RESULTS_RESPONSES_SUBROUTE, RESULTS_FEEDBACK_SUBROUTE]

const useFormResultsNavbar = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const calcCurrentIndex = useCallback(() => {
    const index = RESULTS_ROUTES.findIndex((r) => r && pathname.endsWith(r))
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

  const handleTabsChange = useCallback(
    (index: number) => navigate(RESULTS_ROUTES[index]),
    [navigate],
  )

  return {
    tabIndex,
    handleTabsChange,
  }
}

export const FormResultsNavbarContainer = (): JSX.Element => {
  const { tabIndex, handleTabsChange } = useFormResultsNavbar()

  return (
    <Tabs
      variant="line-light"
      isLazy
      defaultIndex={tabIndex}
      index={tabIndex}
      onChange={handleTabsChange}
    >
      <FormResultsNavbar />
    </Tabs>
  )
}
