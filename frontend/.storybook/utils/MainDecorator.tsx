import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'

import { AuthProvider } from '~contexts/AuthContext'

import { theme } from '../../src/theme'

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })

type Props = { queryClient?: QueryClient }

export const TestProviders: React.FC<Props> = ({
  queryClient = makeQueryClient(),
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ChakraProvider resetCSS theme={theme}>
          <AuthProvider>{children}</AuthProvider>
        </ChakraProvider>
      </HelmetProvider>
    </QueryClientProvider>
  )
}

export const MainDecorator: DecoratorFn = (Story, options) => {
  return (
    <TestProviders queryClient={options.args.queryClient}>
      <Story {...options} />
    </TestProviders>
  )
}
