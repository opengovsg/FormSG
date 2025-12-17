import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Box, Flex, Spacer, Tabs } from '@chakra-ui/react'

import {
  ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  RESULTS_CHARTS_SUBROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'

import { FormResultsNavbar } from './components/FormResultsNavbar'

export const FormResultsLayout = (): JSX.Element => {
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (!formId) throw new Error('No formId provided')

  const checkTabActive = useCallback(
    (to: string) => {
      const match = pathname.match(ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX)
      return (match?.[2] ?? '/') === `/${to}`
    },
    [pathname],
  )

  const tabConfig = [
    { path: RESULTS_RESPONSES_SUBROUTE },
    { path: RESULTS_FEEDBACK_SUBROUTE },
    { path: RESULTS_CHARTS_SUBROUTE },
  ]

  const tabIndex = tabConfig.findIndex((tab) => checkTabActive(tab.path))

  const handleTabChange = (index: number) => {
    const subRoute = tabConfig[index].path
    const path = subRoute
      ? `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}/${subRoute}`
      : `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`
    navigate(path)
  }

  return (
    <Box overflowX="hidden" overflowY="auto" position="relative" flex={1}>
      {' '}
      <Tabs
        orientation="vertical"
        variant="line"
        py={{ base: '2.5rem', lg: '3.125rem' }}
        pl={{ base: 0, md: '1.75rem', lg: '2rem' }}
        pr={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        index={tabIndex === -1 ? 0 : tabIndex}
        onChange={handleTabChange}
      >
        <Flex
          h="max-content"
          flex={1}
          flexShrink={0}
          ref={ref}
          onMouseDown={onMouseDown}
          position="sticky"
          zIndex={0}
          top={{ base: '2.5rem', lg: '3.125rem' }}
          borderTopColor="neutral.300"
          w={{ base: 'auto', lg: '21rem' }}
          __css={{
            scrollbarWidth: 0,
            '&::-webkit-scrollbar': {
              width: 0,
              height: 0,
            },
          }}
        >
          <FormResultsNavbar />
        </Flex>
        <Box maxW="69.5rem" mt={0} w="100%" minW={0} overflowX="hidden">
          <Outlet />
        </Box>
        <Spacer />
      </Tabs>
    </Box>
  )
}
