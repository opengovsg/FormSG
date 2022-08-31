import { Outlet } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { FormResultsNavbar } from './components/FormResultsNavbar'

/**
 * Page for rendering subroutes via `Outlet` component for admin form result pages.
 */
export const FormResultsLayout = (): JSX.Element => {
  return (
    <Flex flexDir="column" flex={1} overflow="hidden" pos="relative">
      <FormResultsNavbar />
      <Outlet />
    </Flex>
  )
}
