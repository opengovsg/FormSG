import { createMemoryRouter, Link, RouterProvider } from 'react-router'
import { ChakraProvider } from '@chakra-ui/react'
import { act, render, screen, waitFor } from '@testing-library/react'

import { theme } from '~theme/index'

import { useNavigationDraft } from './navigationSave'
import { NavigationSaveGuard } from './NavigationSaveGuard'

const renderGuard = (fallbackDirty: boolean) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <NavigationSaveGuard fallbackDirty={fallbackDirty} />
            <Link to="/next">Leave</Link>
          </>
        ),
      },
      { path: '/next', element: <div>Next page</div> },
    ],
    { initialEntries: ['/'] },
  )
  render(
    <ChakraProvider theme={theme}>
      <RouterProvider router={router} />
    </ChakraProvider>,
  )
  return { router }
}

describe('NavigationSaveGuard', () => {
  const save = vi.fn()

  beforeEach(() => {
    save.mockReset()
    // A dirty draft that saves cleanly, as the step login editor registers.
    save.mockImplementation(async () => {
      useNavigationDraft.setState((state) => ({
        draft: state.draft && { ...state.draft, dirty: false },
      }))
      return true
    })
    useNavigationDraft.setState({
      draft: { owner: Symbol('test'), dirty: true, saving: false, save },
    })
  })

  afterEach(() => useNavigationDraft.setState({ draft: null }))

  it('saves the draft and navigates when nothing else is unsaved', async () => {
    const { router } = renderGuard(false)

    act(() => screen.getByText('Leave').click())

    await waitFor(() => expect(router.state.location.pathname).toBe('/next'))
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('saves the draft, then asks before discarding field-builder edits', async () => {
    const { router } = renderGuard(true)

    act(() => screen.getByText('Leave').click())

    expect(
      await screen.findByText('You have unsaved changes'),
    ).toBeInTheDocument()
    expect(save).toHaveBeenCalledTimes(1)
    expect(router.state.location.pathname).toBe('/')
  })
})
