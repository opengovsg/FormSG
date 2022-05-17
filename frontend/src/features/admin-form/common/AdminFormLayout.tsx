import { Outlet, useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'
import { get } from 'lodash'

import AdminForbidden403 from '~pages/AdminForbidden403'
import NotFound404 from '~pages/NotFound404'

import AdminFormNavbar from './components/AdminFormNavbar'
import { useAdminForm } from './queries'

/**
 * Page for rendering subroutes via `Outlet` component for admin form pages.
 */
export const AdminFormLayout = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { error } = useAdminForm()

  if (get(error, 'code') === 404) {
    return <NotFound404 />
  }
  if (get(error, 'code') === 403) {
    return <AdminForbidden403 message={error?.message} />
  }

  return (
    <Flex flexDir="column" height="100vh" overflow="hidden" pos="relative">
      <AdminFormNavbar />
      <Outlet />
    </Flex>
  )
}
