import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import { isCompletionEmailCardReachable } from './isCompletionEmailCardReachable'

const settingsFor = (responseMode: FormResponseMode) =>
  ({ responseMode }) as FormSettings

describe('isCompletionEmailCardReachable', () => {
  it('is reachable on an MRF form', () => {
    expect(
      isCompletionEmailCardReachable({
        settings: settingsFor(FormResponseMode.Multirespondent),
        isSettingsError: false,
      }),
    ).toBe(true)
  })

  it('is unreachable on a form that is not MRF', () => {
    expect(
      isCompletionEmailCardReachable({
        settings: settingsFor(FormResponseMode.Email),
        isSettingsError: false,
      }),
    ).toBe(false)
  })

  it('is reachable while the settings are still in flight', () => {
    expect(
      isCompletionEmailCardReachable({
        settings: undefined,
        isSettingsError: false,
      }),
    ).toBe(true)
  })

  it('is unreachable when the settings never arrived', () => {
    expect(
      isCompletionEmailCardReachable({
        settings: undefined,
        isSettingsError: true,
      }),
    ).toBe(false)
  })

  it('stays reachable when a refetch fails but settings are in hand', () => {
    expect(
      isCompletionEmailCardReachable({
        settings: settingsFor(FormResponseMode.Multirespondent),
        isSettingsError: true,
      }),
    ).toBe(true)
  })
})
