import { act, fireEvent, screen, within } from '@testing-library/react'

import { render } from '~/test-utils'

import { WorkflowActionDescriptor } from './WorkflowActionButtons'
import { WorkflowActionLayout } from './WorkflowActionLayout'

const scrollState = vi.hoisted(() => ({ root: null as HTMLElement | null }))
vi.mock('../IndividualResponsePage/getResponseScrollContainer', () => ({
  getResponseScrollContainer: () => scrollState.root,
}))

const rect = (top: number, bottom: number, width = 600): DOMRect => ({
  top,
  bottom,
  left: 0,
  right: width,
  width,
  height: bottom - top,
  x: 0,
  y: top,
  toJSON: () => ({}),
})
let topBounds: DOMRect
let currentBounds: DOMRect
let scrollRoot: HTMLDivElement
const clicked = vi.fn()
const actions: WorkflowActionDescriptor[] = [
  {
    id: 'remind',
    label: 'Remind',
    tooltip: 'Remind the current assignees to respond.',
    disabled: false,
    loading: false,
    onClick: clicked,
  },
]

const Fixture = ({
  hasActions = true,
  activityVisible = true,
}: {
  hasActions?: boolean
  activityVisible?: boolean
}) => (
  <WorkflowActionLayout
    overview={<h2>Response overview</h2>}
    actions={hasActions ? actions : []}
  >
    {(buttons, rowRef, showActions) =>
      activityVisible ? (
        <section aria-label="Current step">
          <h3>Current step: Step 3</h3>
          {showActions && buttons && (
            <div data-testid="current-actions" ref={rowRef}>
              {buttons}
            </div>
          )}
        </section>
      ) : null
    }
  </WorkflowActionLayout>
)
// The portal wrapper has no semantic role; inspect its placement marker, then query its buttons by role.
const sticky = () =>
  // eslint-disable-next-line testing-library/no-node-access
  document.querySelector<HTMLElement>('[data-workflow-sticky]')
const scroll = () =>
  act(() => {
    fireEvent.scroll(scrollRoot)
  })

beforeEach(() => {
  clicked.mockClear()
  topBounds = rect(100, 150)
  currentBounds = rect(900, 950)
  scrollRoot = document.createElement('div')
  scrollState.root = scrollRoot
  vi.spyOn(scrollRoot, 'getBoundingClientRect').mockImplementation(() =>
    rect(80, 700),
  )
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.testid === 'current-actions'
        ? currentBounds
        : topBounds
    },
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  scrollState.root = null
})

describe('WorkflowActionLayout scrolling integration', () => {
  it('keeps sticky controls inside the drawer focus and stacking boundary', () => {
    topBounds = rect(-100, -50)
    const drawer = document.createElement('section')
    drawer.setAttribute('role', 'dialog')
    drawer.appendChild(scrollRoot)
    document.body.appendChild(drawer)
    render(<Fixture />)
    expect(drawer.contains(sticky())).toBe(true)
    drawer.remove()
  })

  it('moves from top actions to sticky to current actions with one shared handler', () => {
    render(<Fixture />)
    expect(sticky()).toBeNull()
    expect(screen.queryByTestId('current-actions')).not.toBeInTheDocument()
    topBounds = rect(-100, -50)
    scroll()
    expect(sticky()).not.toBeNull()
    fireEvent.click(within(sticky()!).getByRole('button', { name: 'Remind' }))
    expect(clicked).toHaveBeenCalledTimes(1)
    currentBounds = rect(550, 600)
    scroll()
    expect(sticky()).toBeNull()
    fireEvent.click(
      within(screen.getByTestId('current-actions')).getByRole('button', {
        name: 'Remind',
      }),
    )
    expect(clicked).toHaveBeenCalledTimes(2)
  })
  it('keeps sticky actions until the entire wrapped current row is visible', () => {
    topBounds = rect(-100, -50)
    currentBounds = rect(650, 750)
    render(<Fixture />)
    expect(sticky()).not.toBeNull()
    currentBounds = rect(590, 690)
    act(() => {
      fireEvent.resize(window)
    })
    expect(sticky()).toBeNull()
  })
  it('shows sticky actions when the top row is partly clipped by the scroll header', () => {
    topBounds = rect(60, 110)
    render(<Fixture />)
    expect(sticky()).not.toBeNull()
    expect(screen.queryByTestId('current-actions')).not.toBeInTheDocument()
  })
  it('keeps a keyboard-focused sticky row until focus leaves it', () => {
    topBounds = rect(-100, -50)
    render(<Fixture />)
    const focusedButton = within(sticky()!).getByRole('button', {
      name: 'Remind',
    })
    act(() => focusedButton.focus())
    currentBounds = rect(550, 600)
    scroll()
    expect(sticky()).not.toBeNull()
    expect(focusedButton).toHaveFocus()
    act(() =>
      within(screen.getByTestId('current-actions'))
        .getByRole('button', { name: 'Remind' })
        .focus(),
    )
    expect(sticky()).toBeNull()
  })
  it('keeps focused current actions when the top row enters view', () => {
    topBounds = rect(-100, -50)
    currentBounds = rect(550, 600)
    render(<Fixture />)
    const currentButton = within(
      screen.getByTestId('current-actions'),
    ).getByRole('button', { name: 'Remind' })
    act(() => currentButton.focus())
    topBounds = rect(100, 150)
    scroll()
    expect(currentButton).toHaveFocus()
    expect(screen.getByTestId('current-actions')).toBeInTheDocument()
    act(() => screen.getAllByRole('button', { name: 'Remind' })[0].focus())
    expect(screen.queryByTestId('current-actions')).not.toBeInTheDocument()
  })
  it('recomputes fallback when Activity unmounts and disconnects scroll listeners on unmount', () => {
    topBounds = rect(-100, -50)
    currentBounds = rect(550, 600)
    const removeListener = vi.spyOn(scrollRoot, 'removeEventListener')
    const { rerender, unmount } = render(<Fixture />)
    expect(sticky()).toBeNull()
    rerender(<Fixture activityVisible={false} />)
    expect(sticky()).not.toBeNull()
    unmount()
    expect(sticky()).toBeNull()
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
  it('clears sticky focus retention after actions disappear and a new response exposes top actions', () => {
    topBounds = rect(-100, -50)
    const { rerender } = render(<Fixture />)
    act(() => within(sticky()!).getByRole('button', { name: 'Remind' }).focus())
    rerender(<Fixture hasActions={false} />)
    topBounds = rect(100, 150)
    rerender(<Fixture />)
    expect(sticky()).toBeNull()
    expect(screen.queryByTestId('current-actions')).not.toBeInTheDocument()
  })
  it('never creates buttons or sticky fallback when actions are unavailable', () => {
    topBounds = rect(-100, -50)
    render(<Fixture hasActions={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(sticky()).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Current step: Step 3' }),
    ).toBeInTheDocument()
  })
})
