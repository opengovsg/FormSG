import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import {
  CompletionEmailBlockView,
  getCompletionEmailBlockView,
} from './getCompletionEmailBlockView'

const MRF = { responseMode: FormResponseMode.Multirespondent } as FormSettings
const EMAIL_MODE = { responseMode: FormResponseMode.Email } as FormSettings

describe('getCompletionEmailBlockView', () => {
  it('shows the card on an MRF form with two steps', () => {
    expect(
      getCompletionEmailBlockView({
        settings: MRF,
        isSettingsError: false,
        workflowStepCount: 2,
      }),
    ).toBe(CompletionEmailBlockView.Card)
  })

  it.each([0, 1])('shows nothing at %i workflow steps', (workflowStepCount) => {
    expect(
      getCompletionEmailBlockView({
        settings: MRF,
        isSettingsError: false,
        workflowStepCount,
      }),
    ).toBe(CompletionEmailBlockView.None)
  })

  it('shows nothing at one step even when the settings never arrived', () => {
    expect(
      getCompletionEmailBlockView({
        settings: undefined,
        isSettingsError: true,
        workflowStepCount: 1,
      }),
    ).toBe(CompletionEmailBlockView.None)
  })

  it('shows nothing on a form that is not MRF', () => {
    expect(
      getCompletionEmailBlockView({
        settings: EMAIL_MODE,
        isSettingsError: false,
        workflowStepCount: 2,
      }),
    ).toBe(CompletionEmailBlockView.None)
  })

  it('holds the card while the settings are still in flight', () => {
    expect(
      getCompletionEmailBlockView({
        settings: undefined,
        isSettingsError: false,
        workflowStepCount: 2,
      }),
    ).toBe(CompletionEmailBlockView.Card)
  })

  it('falls back to the Settings message when the settings never arrived', () => {
    expect(
      getCompletionEmailBlockView({
        settings: undefined,
        isSettingsError: true,
        workflowStepCount: 2,
      }),
    ).toBe(CompletionEmailBlockView.SettingsMessage)
  })

  it('keeps the card when a refetch fails but settings are in hand', () => {
    expect(
      getCompletionEmailBlockView({
        settings: MRF,
        isSettingsError: true,
        workflowStepCount: 2,
      }),
    ).toBe(CompletionEmailBlockView.Card)
  })
})
