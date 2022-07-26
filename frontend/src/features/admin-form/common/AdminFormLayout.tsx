import { Outlet, useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'
import { get } from 'lodash'

import AdminForbiddenErrorPage from '~pages/AdminForbiddenError'
import NotFoundErrorPage from '~pages/NotFoundError'
// TODO #4279: Remove after React rollout is complete
import { SwitchEnvIcon } from '~features/env/SwitchEnvIcon'

import { StorageResponsesProvider } from '../responses/ResponsesPage/storage/StorageResponsesProvider'

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
    return <NotFoundErrorPage />
  }
  if (get(error, 'code') === 403) {
    return <AdminForbiddenErrorPage message={error?.message} />
  }

  return (
    <Flex flexDir="column" height="100vh" overflow="hidden" pos="relative">
      <AdminFormNavbar />
      <SwitchEnvIcon />
      <StorageResponsesProvider>
        <Outlet />
      </StorageResponsesProvider>
    </Flex>
  )
}
