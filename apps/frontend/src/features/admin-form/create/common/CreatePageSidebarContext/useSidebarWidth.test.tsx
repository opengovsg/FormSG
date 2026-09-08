import { act, render, screen } from '@testing-library/react'

import {
  CreatePageSidebarProvider,
  useCreatePageSidebar,
  useSidebarWidth,
} from './CreatePageSidebarContext'

const Readout = () => <span data-testid="width">{useSidebarWidth()}</span>

const Reporter = ({ width }: { width: number }) => {
  const { reportSidebarWidth } = useCreatePageSidebar()
  return (
    <button type="button" onClick={() => reportSidebarWidth(width)}>
      report
    </button>
  )
}

const widthReadout = () => screen.getByTestId('width').textContent

describe('useSidebarWidth', () => {
  it('reads zero with no provider above it', () => {
    render(<Readout />)

    expect(widthReadout()).toBe('0')
  })

  it('reads zero under a provider until the sidebar reports', () => {
    render(
      <CreatePageSidebarProvider>
        <Readout />
      </CreatePageSidebarProvider>,
    )

    expect(widthReadout()).toBe('0')
  })

  it('reads what the sidebar reported', () => {
    render(
      <CreatePageSidebarProvider>
        <Readout />
        <Reporter width={68} />
      </CreatePageSidebarProvider>,
    )

    act(() => screen.getByRole('button', { name: 'report' }).click())

    expect(widthReadout()).toBe('68')
  })
})
