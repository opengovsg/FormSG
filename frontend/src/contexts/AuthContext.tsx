import { createContext, FC, useContext } from 'react'
import { useQuery } from 'react-query'

import { UserDto } from '~shared/types'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import { fetchUser } from '~services/UserService'

import { userKeys } from '~features/user/queries'

type AuthContextProps = {
  isAuthenticated?: boolean
}

// Exported for testing.
export const AuthContext = createContext<AuthContextProps | undefined>(
  undefined,
)

/**
 * Provider component that wraps your app and makes auth object available to any
 * child component that calls `useAuth()`.
 */
export const AuthProvider: FC = ({ children }) => {
  const auth = useProvideAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

/**
 * Hook for components nested in ProvideAuth component to get the current auth object.
 */
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error(`useAuth must be used within a AuthProvider component`)
  }
  return context
}

// Provider hook that creates auth object and handles state
const useProvideAuth = () => {
  const [isLocalStorageAuthenticated, setIsLocalStorageAuthenticated] =
    useLocalStorage<boolean>(LOGGED_IN_KEY)
  // TODO #4279: Remove after React rollout is complete
  const { data: user } = useQuery<UserDto>(
    userKeys.base,
    () => fetchUser(),
    // 10 minutes staletime, do not need to retrieve so often.
    {
      staleTime: 600000,
      onSuccess: () => setIsLocalStorageAuthenticated(true),
    },
  )
  const isAuthenticated = isLocalStorageAuthenticated || !!user

  // Return the user object and auth methods
  return {
    isAuthenticated,
  }
}
