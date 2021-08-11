import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { ChakraProvider } from '@chakra-ui/react'

import Button from '~/components/Button'
import { AuthProvider, useAuth } from '~/contexts/AuthContext'
import { LoginPage } from '~/pages/login/LoginPage'

import { theme } from '~theme/index'

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
  const { user, isLoading, logout } = useAuth()

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
