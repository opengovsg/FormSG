import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'

import { theme } from '~theme/index'

import { DropdownMenuLayerProvider } from './DropdownMenuLayer'
import { MultiSelect } from './MultiSelect'
import { SingleSelect } from './SingleSelect'

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data = [],
    itemContent,
  }: {
    data?: unknown[]
    itemContent: (index: number, item: unknown) => React.ReactNode
  }) => <>{data.map((item, index) => itemContent(index, item))}</>,
}))

const ITEMS = ['Alpha', 'Bravo']

const renderInLayer = (select: JSX.Element) =>
  render(
    <ChakraProvider theme={theme}>
      <DropdownMenuLayerProvider value="popover">
        {select}
      </DropdownMenuLayerProvider>
    </ChakraProvider>,
  )

describe('DropdownMenuLayerProvider', () => {
  it('lifts the SingleSelect menu to its layer over the theme default', () => {
    renderInLayer(
      <SingleSelect
        name="single"
        value=""
        onChange={() => undefined}
        items={ITEMS}
        initialIsOpen
      />,
    )

    expect(getComputedStyle(screen.getByRole('listbox')).zIndex).toContain(
      'popover',
    )
  })

  it('lifts the MultiSelect menu to its layer over the theme default', () => {
    renderInLayer(
      <MultiSelect
        name="multi"
        values={[]}
        onChange={() => undefined}
        onBlur={() => undefined}
        items={ITEMS}
        defaultIsOpen
      />,
    )

    expect(getComputedStyle(screen.getByRole('listbox')).zIndex).toContain(
      'popover',
    )
  })
})
