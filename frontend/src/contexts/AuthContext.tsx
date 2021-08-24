import { createContext, FC, useCallback, useContext } from 'react'
import { useQueryClient } from 'react-query'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'
import * as AuthService from '~services/AuthService'

type AuthContextProps = {
  sendLoginOtp: typeof AuthService.sendLoginOtp
  verifyLoginOtp: (params: { otp: string; email: string }) => Promise<void>
  logout: typeof AuthService.logout
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const verifyLoginOtp = useCallback(
    async (params: { otp: string; email: string }) => {
      await AuthService.verifyLoginOtp(params)
      setIsLoggedIn(true)
    },
    [setIsLoggedIn],
  )

  const logout = useCallback(() => {
    if (isAuthenticated) {
      // Clear logged in state.
      setIsAuthenticated(false)
    }
  }, [isAuthenticated, setIsAuthenticated])

  // Return the user object and auth methods
  return {
    sendLoginOtp: AuthService.sendLoginOtp,
    verifyLoginOtp: verifyLoginOtp,
    logout,
  }
}
