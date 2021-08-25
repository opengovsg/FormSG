import { createContext, FC, useCallback, useContext, useState } from 'react'

type AuthContextProps = {
  user?: any
  isAuthenticated?: boolean
  login: () => void
  logout: () => void
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

  const mockUser = {
    name: 'Mock User',
    email: 'mock@example.com',
  }

  const login = useCallback(() => {
    setIsAuthenticated(true)
  }, [setIsAuthenticated])

  const logout = useCallback(() => {
    if (isAuthenticated) {
      // Clear logged in state.
      setIsAuthenticated(false)
    }
  }, [isAuthenticated, setIsAuthenticated])

  // Return the user object and auth methods
  return {
    user: isAuthenticated ? mockUser : undefined,
    isAuthenticated,
    login,
    logout,
  }
}
