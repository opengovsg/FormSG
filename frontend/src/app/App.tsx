import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import { AuthProvider } from '~contexts/AuthContext'

import { AppRouter } from './AppRouter'

export const App = (): JSX.Element => (
  <ChakraProvider theme={theme} resetCSS>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </ChakraProvider>
)
