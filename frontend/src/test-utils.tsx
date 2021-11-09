/* eslint-disable testing-library/no-node-access */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, RenderOptions, Screen } from '@testing-library/react'

const AllProviders = ({ children }: { children?: React.ReactNode }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
)

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options })

export { customRender as render }

/**
 * Extends react-testing-library functions.
 * See https://polvara.me/posts/five-things-you-didnt-know-about-testing-library
 */
export const getByTextContent = (
  screen: Screen,
  textMatch: string | RegExp,
): HTMLElement => {
  return screen.getByText((_content, node) => {
    const hasText = (node: Element) => node.textContent === textMatch
    const nodeHasText = hasText(node as Element)
    const childrenDontHaveText = Array.from(node?.children || []).every(
      (child) => !hasText(child),
    )
    return nodeHasText && childrenDontHaveText
  })
}

export const findByTextContent = async (
  screen: Screen,
  textMatch: string | RegExp,
): Promise<HTMLElement> => {
  return screen.findByText((_content, node) => {
    const hasText = (node: Element) => node.textContent === textMatch
    const nodeHasText = hasText(node as Element)
    const childrenDontHaveText = Array.from(node?.children || []).every(
      (child) => !hasText(child),
    )
    return nodeHasText && childrenDontHaveText
  })
}
