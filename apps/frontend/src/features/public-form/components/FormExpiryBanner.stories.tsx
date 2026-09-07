import { Meta, StoryFn } from '@storybook/react'

import { DateString } from 'formsg-shared/types'
import { PublicFormDto } from 'formsg-shared/types/form'

import { PublicFormContext } from '../PublicFormContext'

import { FormExpiryBanner } from './FormExpiryBanner'

/**
 * Rendered against a hand-built context rather than msw, because the banner
 * reads exactly one field and the interesting cases are all about what that
 * field contains.
 */
const withCloseAt = (closeAt: string | null) => {
  const value = {
    form: { closeAt } as unknown as PublicFormDto,
  } as unknown as React.ContextType<typeof PublicFormContext>

  const Decorated: StoryFn = () => (
    <PublicFormContext.Provider value={value}>
      <FormExpiryBanner />
    </PublicFormContext.Provider>
  )
  return Decorated
}

export default {
  title: 'Features/PublicForm/FormExpiryBanner',
  component: FormExpiryBanner,
  parameters: {
    chromatic: { pauseAnimationAtEnd: true, delay: 300 },
  },
} as Meta

/** 2359 SGT on 31 Dec 2026, stored as UTC. Should read as 11:59 PM (SGT). */
export const EndOfYearDeadline = withCloseAt(
  '2026-12-31T15:59:00.000Z' as DateString,
)

/** Midday deadline, to check the am/pm rendering. */
export const MiddayDeadline = withCloseAt(
  '2026-12-31T04:00:00.000Z' as DateString,
)

/** No expiry set — the banner renders nothing at all. */
export const NoExpiry = withCloseAt(null)

/**
 * A deadline that has already passed. The server refuses to serve such a form,
 * so this only happens in a tab left open across the deadline; the banner hides
 * rather than advertising a time that has gone.
 */
export const LapsedDeadline = withCloseAt(
  '2020-01-01T00:00:00.000Z' as DateString,
)
