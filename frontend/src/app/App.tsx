import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'

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

// Init Datadog browser logs
datadogLogs.init({
  clientToken: 'pub30d7ad4705b1bbb6d6bb60b4ac23f789',
  env: 'staging',
  site: 'datadoghq.com',
  service: 'formsg-react',
  // Specify a version number to identify the deployed version of your application in Datadog
  version: '1',
  forwardErrorsToLogs: true,
  sampleRate: 100,
})

export const App = (): JSX.Element => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AppHelmet />
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
