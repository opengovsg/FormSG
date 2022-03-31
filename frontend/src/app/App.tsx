import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { BrowserRouter } from 'react-router-dom'
import { Box, ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import { AuthProvider } from '~contexts/AuthContext'
import { HttpError } from '~services/ApiService'
import GovtMasthead from '~components/GovtMasthead'

import { AppRouter } from './AppRouter'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds,
      retry: (failureCount, error) => {
        // Do not retry if 404.
        if (error instanceof HttpError && error.code === 404) {
          return false
        }
        return failureCount !== 3
      },
    },
  },
})

export const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <BrowserRouter>
      <ChakraProvider theme={theme} resetCSS>
        <AuthProvider>
          <Box height="2rem" width="100vw" position="fixed" top="0" zIndex="1">
            <GovtMasthead />
          </Box>
          <Box height="2rem" width="100vw" />
          <AppRouter />
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
