import React from 'react'
import { Inspector, InspectParams } from 'react-dev-inspector'
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
  clientToken: process.env.REACT_APP_DD_RUM_CLIENT_TOKEN || '',
  env: process.env.REACT_APP_DD_RUM_ENV,
  site: 'datadoghq.com',
  service: 'formsg',
  // Specify a version number to identify the deployed version of your application in Datadog
  version: process.env.REACT_APP_VERSION,
  forwardErrorsToLogs: true,
  sampleRate: 100,
})

export const App = (): JSX.Element => {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <>
      {isDev && (
        <Inspector
          // props see docs:
          // https://github.com/zthxxx/react-dev-inspector#inspector-component-props
          keys={['control', 'shift', 'c']}
          disableLaunchEditor={true}
          onClickElement={({ codeInfo }: InspectParams) => {
            if (!codeInfo?.absolutePath) return
            const { absolutePath, lineNumber, columnNumber } = codeInfo
            // you can change the url protocol if you are using in Web IDE
            window.open(
              `vscode://file/${absolutePath}:${lineNumber}:${columnNumber}`,
            )
          }}
        />
      )}
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
    </>
  )
}
