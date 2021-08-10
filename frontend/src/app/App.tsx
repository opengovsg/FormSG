import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import { getLandingPageStatistics } from '~services/AnalyticsService'

// Create a client
const queryClient = new QueryClient()

export const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <ChakraProvider theme={theme} resetCSS>
      <InnerApp />
    </ChakraProvider>
  </QueryClientProvider>
)

export const InnerApp = () => {
  const { data, isLoading } = useQuery('stats', getLandingPageStatistics)

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <div>{JSON.stringify(data)}</div>
}
