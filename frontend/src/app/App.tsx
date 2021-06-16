import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '~theme/index'
import Button from '~components/Button'

export const App = (): JSX.Element => (
  <ChakraProvider theme={theme} resetCSS>
    Hello world <Button>aaaa</Button>
  </ChakraProvider>
)
