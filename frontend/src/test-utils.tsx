/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, RenderOptions } from '@testing-library/react'

const AllProviders = ({ children }: { children?: React.ReactNode }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
)

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options })

export { customRender as render }
