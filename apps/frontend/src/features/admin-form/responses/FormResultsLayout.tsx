import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router'
import { Box, Tabs } from '@chakra-ui/react'

import {
  ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
} from '~constants/routes'

import { useSideNavCollapse } from '../common/AdminFormSideNav/useSideNavCollapse'

import {
  FormResultsNavbar,
  useResultsTabs,
} from './components/FormResultsNavbar'

export const FormResultsLayout = (): JSX.Element => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tabs = useResultsTabs()
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

  return (
    <Box
      overflowX="hidden"
      overflowY="hidden"
      position="relative"
      flex={1}
      display="flex"
      flexDirection="column"
      minH={0}
    >
      <Tabs
        orientation="vertical"
        variant="line"
        flex={1}
        minH={0}
        p={0}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={handleTabChange}
      >
        <FormResultsNavbar
          tabs={tabs}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onToggle={toggle}
        />
        <Box
          position="relative"
          w="100%"
          minW={0}
          overflowY="auto"
          px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        >
          {/* Keep vertical spacing inside the scroller so sticky table
              headers can reach its top edge. */}
          <Box py={{ base: '2.5rem', lg: '3.125rem' }}>
            <Outlet />
          </Box>
        </Box>
      </Tabs>
    </Box>
  )
}
