import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Box, Tabs } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import {
  ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'

import { useSideNavCollapse } from '../common/AdminFormSideNav/useSideNavCollapse'

import {
  DashboardVersionToggle,
  FormResultsNavbar,
  ResultsNavLayoutProvider,
  useResultsTabs,
} from './components/FormResultsNavbar'

export const FormResultsLayout = (): JSX.Element => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tabs = useResultsTabs()
  const showNavLabels = useFeatureIsOn(featureFlags.sidebarNavLabels)
  const { isCollapsed, isMobile, toggle } = useSideNavCollapse()

  const checkTabActive = useCallback(
    (to: string) => {
      const match = pathname.match(ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX)
      return (match?.[2] ?? '/') === `/${to}`
    },
    [pathname],
  )

  const handleTabChange = useCallback(
    (index: number) => {
      const subroute = tabs[index].path
      const resultsRoute = `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`
      navigate(subroute ? `${resultsRoute}/${subroute}` : resultsRoute)
    },
    [formId, navigate, tabs],
  )

  if (!formId) throw new Error('No formId provided')

  const tabIndex = tabs.findIndex((tab) => checkTabActive(tab.path))
  // The version only changes the responses table, so the toggle has nothing
  // to switch on the Feedback and Charts tabs.
  const isResponsesTab = checkTabActive(RESULTS_RESPONSES_SUBROUTE)

  const versionToggle = isResponsesTab ? (
    <Box
      position="absolute"
      top={{ base: '2.5rem', lg: '3.125rem' }}
      right={
        showNavLabels
          ? { base: '1.5rem', md: '1.75rem', lg: '2rem' }
          : { base: '2.5rem', md: '3.5rem', lg: '4rem' }
      }
      h="1.5rem"
      display="flex"
      alignItems="center"
      zIndex={1}
    >
      <DashboardVersionToggle />
    </Box>
  ) : null

  return (
    <ResultsNavLayoutProvider value={{ showNavLabels }}>
      <Box
        overflowX="hidden"
        overflowY={showNavLabels ? 'hidden' : 'auto'}
        position="relative"
        flex={1}
        display={showNavLabels ? 'flex' : undefined}
        flexDirection={showNavLabels ? 'column' : undefined}
        minH={showNavLabels ? 0 : undefined}
      >
        {!showNavLabels && versionToggle}
        <Tabs
          orientation="vertical"
          variant="line"
          flex={showNavLabels ? 1 : undefined}
          minH={showNavLabels ? 0 : undefined}
          py={showNavLabels ? 0 : { base: '2.5rem', lg: '3.125rem' }}
          pl={showNavLabels ? 0 : { base: 0, md: '1.75rem', lg: '2rem' }}
          pr={showNavLabels ? 0 : { base: '1.5rem', md: '1.75rem', lg: '2rem' }}
          index={tabIndex === -1 ? 0 : tabIndex}
          onChange={handleTabChange}
        >
          <FormResultsNavbar
            tabs={tabs}
            showNavLabels={showNavLabels}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            onToggle={toggle}
          />
          <Box
            position={showNavLabels ? 'relative' : undefined}
            w="100%"
            minW={0}
            overflowY={showNavLabels ? 'auto' : undefined}
            px={
              showNavLabels
                ? { base: '1.5rem', md: '1.75rem', lg: '2rem' }
                : undefined
            }
          >
            {showNavLabels && versionToggle}
            {/* Keep vertical spacing inside the scroller so sticky table
                headers can reach its top edge. */}
            <Box
              py={
                showNavLabels ? { base: '2.5rem', lg: '3.125rem' } : undefined
              }
            >
              <Outlet />
            </Box>
          </Box>
        </Tabs>
      </Box>
    </ResultsNavLayoutProvider>
  )
}
