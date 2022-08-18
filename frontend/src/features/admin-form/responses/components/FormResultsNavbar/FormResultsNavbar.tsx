import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import {
  ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX,
  RESULTS_FEEDBACK_SUBROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'
import { NavigationTab, NavigationTabList } from '~templates/NavigationTabs'

const RESULTS_ROUTES = [RESULTS_RESPONSES_SUBROUTE, RESULTS_FEEDBACK_SUBROUTE]

export const FormResultsNavbar = (): JSX.Element => {
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  const { pathname } = useLocation()

  const checkTabActive = useCallback(
    (to: string) => {
      const match = pathname.match(ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX)
      return (match?.[2] ?? '/') === `/${to}`
    },
    [pathname],
  )

  return (
    <Flex
      w="100vw"
      position="sticky"
      top={0}
      flexDir="column"
      boxShadow="0 1px 1px var(--chakra-colors-neutral-300)"
      bg="white"
      zIndex="docked"
      flex={0}
    >
      <NavigationTabList
        ref={ref}
        onMouseDown={onMouseDown}
        maxW="69.5rem"
        px="1.25rem"
        pt="0.625rem"
        m="auto"
        w="100vw"
        borderBottom="none"
        justifySelf="flex-start"
      >
        <NavigationTab
          to={RESULTS_ROUTES[0]}
          isActive={checkTabActive(RESULTS_ROUTES[0])}
        >
          Responses
        </NavigationTab>
        <NavigationTab
          to={RESULTS_ROUTES[1]}
          isActive={checkTabActive(RESULTS_ROUTES[1])}
        >
          Feedback
        </NavigationTab>
      </NavigationTabList>
    </Flex>
  )
}
