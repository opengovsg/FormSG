import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import { AuthProvider } from '~contexts/AuthContext'

import { AppRouter } from './AppRouter'

// Create a client
const queryClient = new QueryClient()

export const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <ChakraProvider theme={theme} resetCSS>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ChakraProvider>
  </QueryClientProvider>
)
