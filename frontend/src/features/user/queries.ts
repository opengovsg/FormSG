import { useQuery } from '@tanstack/react-query'
import { StatusCodes } from 'http-status-codes'

import { UserDto } from '~shared/types/user'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { HttpError } from '~services/ApiService'
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
  const [, setIsLocalStorageAuthenticated] =
    useLocalStorage<boolean>(LOGGED_IN_KEY)

  const {
    data: user,
    isLoading,
    remove,
  } = useQuery(userKeys.base, () => fetchUser(), {
    onSuccess: () => setIsLocalStorageAuthenticated(true),
    onError: (err) => {
      if (err instanceof HttpError && err.code === StatusCodes.UNAUTHORIZED) {
        setIsLocalStorageAuthenticated(undefined)
      }
    },
    // 10 minutes staletime, do not need to retrieve so often.
    staleTime: 600000,
  })

  return {
    user,
    isLoading,
    removeQuery: remove,
  }
}
