import { useQuery } from 'react-query'
import { Divider } from '@chakra-ui/react'

import { useAuth } from '~contexts/AuthContext'
import { getLandingPageStatistics } from '~services/AnalyticsService'
import Button from '~components/Button'

export const WorkspacePage = (): JSX.Element => {
  const { user, logout } = useAuth()

  const { data, isLoading } = useQuery('stats', getLandingPageStatistics)

  return (
    <div>
      Logged in: {JSON.stringify(user)}
      <Button onClick={logout}>Logout</Button>
      <Divider />
      {isLoading ? <div>Loading...</div> : <div>{JSON.stringify(data)}</div>}
    </div>
  )
}
