import { useAuth } from '~contexts/AuthContext'
import { useUser } from '~hooks/useUser'
import Button from '~components/Button'

export const WorkspacePage = (): JSX.Element => {
  const { logout } = useAuth()
  const { user } = useUser()

  return (
    <div>
      Logged in: {JSON.stringify(user)}
      <Button onClick={logout}>Logout</Button>
    </div>
  )
}
