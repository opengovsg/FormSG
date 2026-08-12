import { CreateFormFlowStates } from '../CreateFormWizardContext'

import { getCreateFormProgress } from './createFormProgress'

describe('getCreateFormProgress', () => {
  it('shows a 3-step sequence on the paper-tracking flow', () => {
    expect(
      getCreateFormProgress({
        currentStep: CreateFormFlowStates.Details,
        isLegacySetup: false,
        isPaperTrackingSetUpPageEnabled: true,
      }),
    ).toEqual({ show: true, numIndicators: 3, currActiveIdx: 0 })
  })

  it('shows a 2-step sequence on the legacy flow, starting at step 1', () => {
    expect(
      getCreateFormProgress({
        currentStep: CreateFormFlowStates.StorageModeDetails,
        isLegacySetup: true,
        isPaperTrackingSetUpPageEnabled: true,
      }),
    ).toEqual({ show: true, numIndicators: 2, currActiveIdx: 0 })
  })

  it('keeps the 2-step legacy sequence on the shared secret-key page', () => {
    expect(
      getCreateFormProgress({
        currentStep: CreateFormFlowStates.Landing,
        isLegacySetup: true,
        isPaperTrackingSetUpPageEnabled: true,
      }),
    ).toEqual({ show: true, numIndicators: 2, currActiveIdx: 1 })
  })

  it('hides the indicator when the paper-tracking flag is off', () => {
    expect(
      getCreateFormProgress({
        currentStep: CreateFormFlowStates.Details,
        isLegacySetup: false,
        isPaperTrackingSetUpPageEnabled: false,
      }).show,
    ).toBe(false)
  })

  it('hides the indicator on a step outside the sequence', () => {
    expect(
      getCreateFormProgress({
        currentStep: CreateFormFlowStates.EmailFeedback,
        isLegacySetup: false,
        isPaperTrackingSetUpPageEnabled: true,
      }).show,
    ).toBe(false)
  })
})
