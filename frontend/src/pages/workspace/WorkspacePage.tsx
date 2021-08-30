import { useAuth } from '~contexts/AuthContext'
import Button from '~components/Button'

export const WorkspacePage = (): JSX.Element => {
  const { user, logout } = useAuth()

  return (
    <div>
      Logged in: {JSON.stringify(user)}
      <Button onClick={logout}>Logout</Button>
    </div>
  )
}
