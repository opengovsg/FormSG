import { useEffect } from 'react'
import { act, renderHook } from '@testing-library/react'

import { useSessionStorage } from './useSessionStorage'

const KEY = 'useSessionStorage-test'

describe('useSessionStorage', () => {
  beforeEach(() => sessionStorage.clear())

  it('does not bring back an entry another instance removed while mounting', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ secret: 'value' }))

    renderHook(() => {
      const [, , remove] = useSessionStorage<{ secret: string }>(KEY)
      useEffect(() => {
        remove()
      }, [remove])
      // Reads the entry during the first render, before the removal above.
      useSessionStorage<{ secret: string }>(KEY)
    })

    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('writes a changed value and a default when nothing was stored', () => {
    const { result } = renderHook(() =>
      useSessionStorage<string>(KEY, 'default'),
    )
    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify('default'))

    act(() => result.current[1]('changed'))

    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify('changed'))
  })
})
