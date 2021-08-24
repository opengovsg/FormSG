import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import { AuthProvider, useAuth } from '~contexts/AuthContext'
import { useUser } from '~hooks/useUser'
import Button from '~components/Button'

import { LoginPage } from '~pages/login/LoginPage'

// Create a client
const queryClient = new QueryClient()

export const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <ChakraProvider theme={theme} resetCSS>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </ChakraProvider>
  </QueryClientProvider>
)

export const InnerApp = () => {
  const { isLoading, user } = useUser()
  const { logout } = useAuth()

  if (isLoading) {
    return <div>...Loading...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div>
      Logged in: {JSON.stringify(user)}
      <Button onClick={logout}>Logout</Button>
    </div>
  )
}
