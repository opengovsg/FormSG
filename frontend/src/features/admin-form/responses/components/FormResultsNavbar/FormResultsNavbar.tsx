import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import {
  ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX,
  RESULTS_FEEDBACK_SUBROUTE,
  RESULTS_INSIGHTS_SUBROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'
import { noPrintCss } from '~utils/noPrintCss'
import { NavigationTab, NavigationTabList } from '~templates/NavigationTabs'

import { useAdminForm } from '~features/admin-form/common/queries'

export const FormResultsNavbar = (): JSX.Element => {
  const { ref, onMouseDown } = useDraggable<HTMLDivElement>()

  const { data: form } = useAdminForm()

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
      sx={noPrintCss}
      w="100vw"
      position="sticky"
      top={0}
      flexDir="column"
      borderBottom="1px"
      borderBottomColor="neutral.300"
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
          to={RESULTS_RESPONSES_SUBROUTE}
          isActive={checkTabActive(RESULTS_RESPONSES_SUBROUTE)}
        >
          Responses
        </NavigationTab>
        <NavigationTab
          to={RESULTS_FEEDBACK_SUBROUTE}
          isActive={checkTabActive(RESULTS_FEEDBACK_SUBROUTE)}
        >
          Feedback
        </NavigationTab>
        {form?.responseMode === FormResponseMode.Encrypt ? (
          <NavigationTab
            to={RESULTS_INSIGHTS_SUBROUTE}
            isActive={checkTabActive(RESULTS_INSIGHTS_SUBROUTE)}
          >
            Insights
          </NavigationTab>
        ) : null}
      </NavigationTabList>
    </Flex>
  )
}
