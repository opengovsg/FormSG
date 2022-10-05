import { useQuery } from 'react-query'

import { UserDto } from '~shared/types/user'

import { useAuth } from '~contexts/AuthContext'
import { fetchUser } from '~services/UserService'

export const userKeys = {
  base: ['user'] as const,
}

type UseUserReturn = {
  user: UserDto | undefined
  isLoading: boolean
  removeQuery: () => void
}

export const useUser = (): UseUserReturn => {
  const { isAuthenticated } = useAuth()

  const {
    data: user,
    isLoading,
    remove,
  } = useQuery<UserDto>(
    userKeys.base,
    () => fetchUser(),
    // 10 minutes staletime, do not need to retrieve so often.
    { staleTime: 600000, enabled: !!isAuthenticated },
  )

  return {
    user: isAuthenticated ? user : undefined,
    isLoading,
    removeQuery: remove,
  }
}
