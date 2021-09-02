import { useQuery } from 'react-query'

import { UserDto } from '~shared/types/user'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { fetchUser } from '~services/UserService'

const userKeys = {
  base: ['user'] as const,
}

type UseUserReturn = {
  user: UserDto | undefined
  isLoading: boolean
}

export const useUser = (): UseUserReturn => {
  const [isLoggedIn] = useLocalStorage<boolean>(LOGGED_IN_KEY)

  const { data: user, isLoading } = useQuery<UserDto>(
    userKeys.base,
    () => fetchUser(),
    // 10 minutes staletime, do not need to retrieve so often.
    { staleTime: 600000, enabled: !!isLoggedIn },
  )

  return {
    user: isLoggedIn ? user : undefined,
    isLoading,
  }
}
