import { renderHook } from '@testing-library/react'

import { DateString } from 'formsg-shared/types'

import { useFormHeader } from './useFormHeader'

const renderHeader = (closeAt: DateString | null) =>
  renderHook(() => useFormHeader({ closeAt }))

describe('useFormHeader', () => {
  describe('closeAtString', () => {
    it('renders the deadline in Singapore time with the zone label', () => {
      // 2359 SGT on 31 Dec 2026, stored as UTC.
      const { result } = renderHeader('2026-12-31T15:59:00.000Z' as DateString)

      expect(result.current.closeAtString).toBe(
        'Responses close at 31 Dec 2026, 11:59 PM (SGT)',
      )
    })

    it('is empty when no deadline is set', () => {
      const { result } = renderHeader(null)

      expect(result.current.closeAtString).toBe('')
    })

    it('is empty once the deadline has passed', () => {
      const { result } = renderHeader('2000-01-01T00:00:00.000Z' as DateString)

      expect(result.current.closeAtString).toBe('')
    })
  })
})
