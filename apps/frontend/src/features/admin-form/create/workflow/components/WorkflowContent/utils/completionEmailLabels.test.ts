import { TFunction } from 'i18next'

import {
  formatEmailFieldLabel,
  formatNotifiedStepLabel,
} from './completionEmailLabels'

// Stands in for i18n so the composition is testable without a provider.
const t = ((_key: string, { stepNumber }: { stepNumber: number }) =>
  `Step ${stepNumber}`) as unknown as TFunction

describe('formatEmailFieldLabel', () => {
  it('should prefix the question number when the field has one', () => {
    expect(
      formatEmailFieldLabel({ questionNumber: 2, title: 'Your email' }),
    ).toBe('2. Your email')
  })

  it('should fall back to the bare title when there is no question number', () => {
    expect(formatEmailFieldLabel({ title: 'Your email' })).toBe('Your email')
  })
})

describe('formatNotifiedStepLabel', () => {
  it('should append the step name in brackets when the step is named', () => {
    expect(
      formatNotifiedStepLabel(t, { stepNumber: 2, stepName: 'Approver' }),
    ).toBe('Step 2 (Approver)')
  })

  it('should return the step alone when it is unnamed', () => {
    expect(formatNotifiedStepLabel(t, { stepNumber: 3 })).toBe('Step 3')
  })
})
