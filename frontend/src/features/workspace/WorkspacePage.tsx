import { useCallback } from 'react'
import { useQueryClient } from 'react-query'
import { Link as ReactLink } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/hooks'
import { Text } from '@chakra-ui/react'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { ADMINFORM_ROUTE } from '~constants/routes'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { logout } from '~services/AuthService'
import Button from '~components/Button'
import Link from '~components/Link'

import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'

import { useWorkspace } from './queries'

export const WorkspacePage = (): JSX.Element => {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] =
    useLocalStorage<boolean>(LOGGED_IN_KEY)

  const modalProps = useDisclosure()

  const handleLogout = useCallback(async () => {
    await logout()
    if (isAuthenticated) {
      // Clear logged in state.
      setIsAuthenticated(undefined)
    }
    queryClient.clear()
  }, [isAuthenticated, queryClient, setIsAuthenticated])

  const { user } = useUser()

  const { data: dashboardForms } = useWorkspace()

  return (
    <div>
      <Text>Logged in: {JSON.stringify(user)}</Text>
      {dashboardForms?.map((form) => {
        return (
          <Link
            key={form._id}
            as={ReactLink}
            to={`${ADMINFORM_ROUTE}/${form._id}`}
          >
            {form.title}
          </Link>
        )
      })}
      <Button onClick={handleLogout}>Logout</Button>
      <br />
      <Button onClick={modalProps.onOpen}>Emergency Contact</Button>
      <EmergencyContactModal {...modalProps} />
    </div>
  )
}
