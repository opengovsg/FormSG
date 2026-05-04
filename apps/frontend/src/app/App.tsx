import { Inspector, InspectParams } from 'react-dev-inspector'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { ChakraProvider } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'

import { theme } from '~theme/index'
import { AuthProvider } from '~contexts/AuthContext'
import { GrowthBookProvider } from '~contexts/GrowthbookContext'
import { HttpError } from '~services/ApiService'

import { TurnstileChallengeProvider } from '~features/turnstile/TurnstileChallengeProvider'

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

// In production, route logs through our own backend so the browser doesn't
// talk to Datadog directly. Other envs go direct to Datadog so we don't have
// to stand up the proxy route in every deployment.
//
// This mirrors the equivalent ddProxyUrl logic in datadog-chunk.ts. It is
// intentionally duplicated rather than hoisted into a shared util:
// datadog-chunk.ts is built as a separate non-Vite-bundled chunk loaded by a
// <script> tag in index.html, and importing from a shared module here could
// pull it into Vite's main bundle and break that isolation.
const ddLogsProxyUrl =
  window.__ENV__?.ddRumEnv === 'production'
    ? `${window.__ENV__?.appUrl ?? window.location.origin}/api/v1/proxy/datadog/logs`
    : undefined

// Init Datadog browser logs
datadogLogs.init({
  clientToken: import.meta.env.VITE_APP_DD_RUM_CLIENT_TOKEN || '',
  env: window.__ENV__?.ddRumEnv ?? import.meta.env.VITE_APP_DD_RUM_ENV,
  site: 'datadoghq.com',
  service: 'formsg-react',
  proxy: ddLogsProxyUrl,
  // Specify a version number to identify the deployed version of your application in Datadog
  version: import.meta.env.VITE_APP_VERSION,
  forwardErrorsToLogs: true,
  sampleRate: 100,
})

export const App = (): JSX.Element => {
  const isDev = import.meta.env.MODE === 'development'

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
        {/* FIXME: react 18 types */}
        {/* @ts-expect-error missing FC type in old version */}
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <AppHelmet />
          <ChakraProvider theme={theme} resetCSS>
            <TurnstileChallengeProvider>
              <AuthProvider>
                <GrowthBookProvider>
                  <AppRouter />
                </GrowthBookProvider>
              </AuthProvider>
            </TurnstileChallengeProvider>
          </ChakraProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </>
  )
}
