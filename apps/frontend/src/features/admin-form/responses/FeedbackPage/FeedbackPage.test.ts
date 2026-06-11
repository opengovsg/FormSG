import { describe, expect, it } from 'vitest'

import { getFeedbackPageView } from './FeedbackPage'

describe('getFeedbackPageView', () => {
  it('stays in the loading view until both the reviews and issues queries resolve', () => {
    // The flicker bug: reviews resolved with no feedback, but issues still loading.
    // The empty/content decision depends on both counts, so we must keep showing
    // the skeleton rather than briefly rendering content (or empty) too early.
    const view = getFeedbackPageView(
      { count: 0, isGetLoading: false },
      { count: undefined, isGetLoading: true },
    )

    expect(view).toBe('loading')
  })

  it('stays in the loading view when issues resolve before reviews', () => {
    const view = getFeedbackPageView(
      { count: undefined, isGetLoading: true },
      { count: 0, isGetLoading: false },
    )

    expect(view).toBe('loading')
  })

  it('shows the loading view while both queries are still loading', () => {
    const view = getFeedbackPageView(
      { count: undefined, isGetLoading: true },
      { count: undefined, isGetLoading: true },
    )

    expect(view).toBe('loading')
  })

  it('shows the empty view once both queries resolve with no feedback', () => {
    const view = getFeedbackPageView(
      { count: 0, isGetLoading: false },
      { count: 0, isGetLoading: false },
    )

    expect(view).toBe('empty')
  })

  it('shows content when either reviews or issues have entries', () => {
    expect(
      getFeedbackPageView(
        { count: 3, isGetLoading: false },
        { count: 0, isGetLoading: false },
      ),
    ).toBe('content')

    expect(
      getFeedbackPageView(
        { count: 0, isGetLoading: false },
        { count: 5, isGetLoading: false },
      ),
    ).toBe('content')
  })
})
