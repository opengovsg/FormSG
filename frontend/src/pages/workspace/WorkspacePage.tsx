import { useCallback } from 'react'
import { useQueryClient } from 'react-query'
import { useDisclosure } from '@chakra-ui/hooks'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { logout } from '~services/AuthService'
import Button from '~components/Button'

import { EmergencyContactModal } from '~features/user/emergency-contact/EmergencyContactModal'
import { useUser } from '~features/user/queries'

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

  return (
    <div>
      Logged in: {JSON.stringify(user)}
      <Button onClick={handleLogout}>Logout</Button>
      <br />
      <Button onClick={modalProps.onOpen}>Emergency Contact</Button>
      <EmergencyContactModal {...modalProps} />
    </div>
  )
}
