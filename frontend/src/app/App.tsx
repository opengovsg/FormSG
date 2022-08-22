import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { BrowserRouter } from 'react-router-dom'
import { Partytown } from '@builder.io/partytown/react'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import { AuthProvider } from '~contexts/AuthContext'
import { HttpError } from '~services/ApiService'

import { AppHelmet } from './AppHelmet'
import { AppRouter } from './AppRouter'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds,
      retry: (failureCount, error) => {
        // Do not retry on 4xx error codes.
        if (error instanceof HttpError && String(error.code).startsWith('4')) {
          return false
        }
        return failureCount !== 3
      },
    },
  },
})

export const App = (): JSX.Element => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AppHelmet />
      <Partytown debug={true} forward={['dataLayer.push']} />
      <BrowserRouter>
        <ChakraProvider theme={theme} resetCSS>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ChakraProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
)
