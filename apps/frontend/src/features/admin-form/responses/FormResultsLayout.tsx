import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Box, Tabs } from '@chakra-ui/react'

import {
  ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
} from '~constants/routes'

import {
  FormResultsNavbar,
  useResultsTabs,
} from './components/FormResultsNavbar'

export const FormResultsLayout = (): JSX.Element => {
  const { formId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tabs = useResultsTabs()

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
    <Box overflowX="hidden" overflowY="auto" position="relative" flex={1}>
      <Tabs
        orientation="vertical"
        variant="line"
        py={{ base: '2.5rem', lg: '3.125rem' }}
        pl={{ base: 0, md: '1.75rem', lg: '2rem' }}
        pr={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={handleTabChange}
      >
        <FormResultsNavbar tabs={tabs} />
        <Box w="100%" minW={0}>
          <Outlet />
        </Box>
      </Tabs>
    </Box>
  )
}
