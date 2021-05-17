/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
<<<<<<< HEAD
import * as React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, RenderOptions } from '@testing-library/react'
=======
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, RenderOptions } from '@testing-library/react'
import * as React from 'react'
>>>>>>> 5fbcb881 (feat(react): add base react app directory in root of the application (#1819))

const AllProviders = ({ children }: { children?: React.ReactNode }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
)

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options })

export { customRender as render }
