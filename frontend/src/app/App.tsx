import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import { AuthProvider } from '~contexts/AuthContext'

import { AppRouter } from './AppRouter'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
    },
  },
})

export const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <BrowserRouter>
      <ChakraProvider theme={theme} resetCSS>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
