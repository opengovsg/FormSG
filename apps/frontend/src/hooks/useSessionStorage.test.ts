import { act, renderHook } from '@testing-library/react'

import { useSessionStorage } from './useSessionStorage'

const KEY = 'useSessionStorage-test'
const stored = () => sessionStorage.getItem(KEY)

describe('useSessionStorage', () => {
  beforeEach(() => sessionStorage.clear())

  it('does not write back a value it read from storage on mount', () => {
    sessionStorage.setItem(KEY, JSON.stringify('A'))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    renderHook(() => useSessionStorage<string>(KEY))

    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('saves a return to the value it first read (A → B → A)', () => {
    sessionStorage.setItem(KEY, JSON.stringify('A'))
    const { result } = renderHook(() => useSessionStorage<string>(KEY))

    act(() => result.current[1]('B'))
    expect(stored()).toBe(JSON.stringify('B'))

    act(() => result.current[1]('A'))
    expect(stored()).toBe(JSON.stringify('A'))
  })
})
