import { useState } from 'react'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  saveBeforeNavigation,
  useRegisterNavigationSave,
} from './navigationSave'
import { NavigationSaveGuard } from './NavigationSaveGuard'

const setup = (save: () => Promise<boolean>) => {
  const Editor = () => {
    const [dirty, setDirty] = useState(false)
    useRegisterNavigationSave({ isDirty: dirty, save })
    return (
      <>
        <NavigationSaveGuard />
        <button onClick={() => setDirty(true)}>Edit</button>
        <button onClick={() => setDirty(false)}>Cancel</button>
        <Link to="/settings">Settings</Link>
      </>
    )
  }
  const router = createMemoryRouter([
    { path: '/', element: <Editor /> },
    { path: '/settings', element: <p>Settings page</p> },
  ])
  render(<RouterProvider router={router} />)
  return router
}

describe('workflow navigation saves', () => {
  it('awaits a dirty draft save before navigating and shares repeated attempts', async () => {
    let finish: (saved: boolean) => void = () => undefined
    const save = vi.fn(
      () => new Promise<boolean>((resolve) => (finish = resolve)),
    )
    const router = setup(save)
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Settings'))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(router.state.location.pathname).toBe('/')
    const pending = saveBeforeNavigation()
    await act(async () => finish(true))
    expect(await pending).toBe(true)
    await screen.findByText('Settings page')
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('keeps the draft when validation or saving fails, and permits a retry', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(true)
    const router = setup(save)
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Settings'))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(
        [...router.state.blockers.values()].every(
          (b) => b.state === 'unblocked',
        ),
      ).toBe(true),
    )
    expect(router.state.location.pathname).toBe('/')
    fireEvent.click(screen.getByText('Settings'))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(
        [...router.state.blockers.values()].every(
          (b) => b.state === 'unblocked',
        ),
      ).toBe(true),
    )
    expect(router.state.location.pathname).toBe('/')
    fireEvent.click(screen.getByText('Settings'))
    await screen.findByText('Settings page')
    expect(save).toHaveBeenCalledTimes(3)
  })

  it('Cancel discards the draft without saving when navigating afterwards', async () => {
    const save = vi.fn()
    setup(save)
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Cancel'))
    fireEvent.click(screen.getByText('Settings'))
    await screen.findByText('Settings page')
    expect(save).not.toHaveBeenCalled()
  })

  it('warns on browser closure while dirty without attempting an asynchronous save', () => {
    const save = vi.fn()
    setup(save)
    fireEvent.click(screen.getByText('Edit'))
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Cancel'))
    const cleanEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(cleanEvent)
    expect(cleanEvent.defaultPrevented).toBe(false)
  })
})
