import { Outlet } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'

import AdminFormNavbar from './components/AdminFormNavbar'

/**
 * Page for rendering subroutes via `Outlet` component for admin form pages.
 */
export const AdminFormLayout = (): JSX.Element => {
  return (
    <Flex flexDir="column" height="100vh" overflow="hidden" pos="relative">
      <AdminFormNavbar />
      <Box
        overflow="auto"
        flex={1}
        py={{ base: '2.5rem', lg: '3.125rem' }}
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        // Buffer for bottom navbar in mobile breakpoints.
        mb={{ base: '4rem', md: 'initial' }}
      >
        <Outlet />
      </Box>
    </Flex>
  )
}
