import i18next from 'i18next'

import {
  CompletionPeekMomentType,
  getCompletionPeekActionLabels,
  getCompletionPeekContent,
  isCompletionPeekTucked,
} from './completionPeekContent'

const t = i18next.t.bind(i18next)

describe('getCompletionPeekContent', () => {
  it('should give step 1 its own wording, not the later-step wording', () => {
    const stepOne = getCompletionPeekContent(t, {
      type: CompletionPeekMomentType.StepOneDone,
    })
    const laterStep = getCompletionPeekContent(t, {
      type: CompletionPeekMomentType.LaterStepDone,
      stepNumber: 1,
    })

    expect(stepOne.title).not.toEqual(laterStep.title)
    expect(stepOne.subtitle).not.toEqual(laterStep.subtitle)
    expect(stepOne.title).toContain('public-facing')
  })

  // The store and WorkflowContent are zero-based, the admin counts from one.
  it('should render a zero-based step number as its one-based label', () => {
    expect(
      getCompletionPeekContent(t, {
        type: CompletionPeekMomentType.LaterStepDone,
        stepNumber: 1,
      }).title,
    ).toEqual('Nice, Step 2 is all set')

    expect(
      getCompletionPeekContent(t, {
        type: CompletionPeekMomentType.LaterStepDone,
        stepNumber: 4,
      }).title,
    ).toEqual('Nice, Step 5 is all set')
  })

  it('should resolve a title and subtitle for every moment', () => {
    const moments = [
      { type: CompletionPeekMomentType.StepOneDone },
      { type: CompletionPeekMomentType.LaterStepDone, stepNumber: 1 },
      { type: CompletionPeekMomentType.EmailSetUp },
      { type: CompletionPeekMomentType.StatusTracking },
      { type: CompletionPeekMomentType.GuidedSetupFinished },
    ] as const

    moments.forEach((moment) => {
      const { title, subtitle } = getCompletionPeekContent(t, moment)
      // A missing key resolves to the key itself, so this catches a typo or an
      // enum member added without copy.
      expect(title).not.toContain('completionPeek')
      expect(subtitle).not.toContain('completionPeek')
      expect(title.length).toBeGreaterThan(0)
      expect(subtitle.length).toBeGreaterThan(0)
    })
  })
})

describe('isCompletionPeekTucked', () => {
  it('should tuck every moment except the email one', () => {
    expect(
      isCompletionPeekTucked({ type: CompletionPeekMomentType.EmailSetUp }),
    ).toBe(false)

    const tucked = [
      { type: CompletionPeekMomentType.StepOneDone },
      { type: CompletionPeekMomentType.LaterStepDone, stepNumber: 1 },
      { type: CompletionPeekMomentType.StatusTracking },
      { type: CompletionPeekMomentType.GuidedSetupFinished },
    ] as const

    tucked.forEach((moment) => {
      expect(isCompletionPeekTucked(moment)).toBe(true)
    })
  })
})

describe('getCompletionPeekActionLabels', () => {
  it('should resolve every action label', () => {
    const labels = getCompletionPeekActionLabels(t)

    expect(labels).toEqual({
      declineAnotherStep: "No, I'm done",
      addAnotherStep: 'Yes, add a step',
      continue: 'Continue',
      finish: 'Done',
    })
  })
})
