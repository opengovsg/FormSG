import { Outlet } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import AdminFormNavbar from './components/AdminFormNavbar'

/**
 * Page for rendering subroutes via `Outlet` component for admin form pages.
 */
export const AdminFormLayout = (): JSX.Element => {
  return (
    <Flex flexDir="column" height="100vh" overflow="hidden" pos="relative">
      <AdminFormNavbar />
      <Outlet />
    </Flex>
  )
}
