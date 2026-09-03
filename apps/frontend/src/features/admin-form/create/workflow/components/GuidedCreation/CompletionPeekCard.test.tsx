import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { fireEvent, render, screen } from '@testing-library/react'

import { featureFlags } from 'formsg-shared/constants'
import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'

import { CompletionPeekMomentType } from './utils/completionPeekContent'
import { CompletionPeekCard } from './CompletionPeekCard'

const withFlag = (isOn: boolean) =>
  new GrowthBook({
    features: {
      [featureFlags.workflowBuilderRedesign]: { defaultValue: isOn },
    },
  })

const renderCard = (
  props: Parameters<typeof CompletionPeekCard>[0],
  { isFlagOn = true }: { isFlagOn?: boolean } = {},
) =>
  render(
    <GrowthBookProvider growthbook={withFlag(isFlagOn)}>
      <CompletionPeekCard {...props} />
    </GrowthBookProvider>,
  )

describe('CompletionPeekCard', () => {
  // The app's i18n instance, imported so the suite does not rely on the setup
  // file having pulled it in, and pinned so the language is the suite's choice
  // rather than whatever jsdom reports. Insurance rather than load-bearing:
  // this copy exists only in en-SG today, so every locale falls back to it.
  //
  // Left going through the real resources rather than mocked, because the copy
  // resolving at all is part of what these tests are for: the union, the
  // labels and the locale keys have to line up, and a stubbed `t` would assert
  // the stub instead.
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))

  afterEach(() => useAdminWorkflowStore.getState().reset())

  it('should render the copy and both actions for a finished step', () => {
    renderCard({
      type: CompletionPeekMomentType.LaterStepDone,
      stepNumber: 1,
      onDeclineAnotherStep: () => undefined,
      onAddAnotherStep: () => undefined,
    })

    expect(screen.getByText('Nice, Step 2 is all set')).toBeInTheDocument()
    expect(
      screen.getByText('Would you like to add another step?'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      "No, I'm done",
      'Yes, add a step',
    ])
  })

  it('should wire each of the two step actions to its own callback', () => {
    const onDeclineAnotherStep = vi.fn()
    const onAddAnotherStep = vi.fn()

    renderCard({
      type: CompletionPeekMomentType.StepOneDone,
      onDeclineAnotherStep,
      onAddAnotherStep,
    })

    fireEvent.click(screen.getByRole('button', { name: "No, I'm done" }))
    expect(onDeclineAnotherStep).toHaveBeenCalledTimes(1)
    expect(onAddAnotherStep).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, add a step' }))
    expect(onAddAnotherStep).toHaveBeenCalledTimes(1)
  })

  it('should render one action for the single-action moments', () => {
    const onContinue = vi.fn()
    const { unmount } = renderCard({
      type: CompletionPeekMomentType.EmailSetUp,
      onContinue,
    })

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Continue',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onContinue).toHaveBeenCalledTimes(1)
    unmount()

    const onFinish = vi.fn()
    renderCard({
      type: CompletionPeekMomentType.StatusTracking,
      onFinish,
    })

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Done',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  // Requirement 6, and the one that matters most: this is live for the whole
  // Singapore government, so flag-off must render nothing at all.
  it('should render nothing when the redesign flag is off', () => {
    const { container } = renderCard(
      {
        type: CompletionPeekMomentType.GuidedSetupFinished,
        onFinish: () => undefined,
      },
      { isFlagOn: false },
    )

    expect(container).toBeEmptyDOMElement()
  })

  // A peek card reports on a finished card, so while one is open for editing
  // nothing is finished. Owned here so no call site can forget it.
  it('should render nothing while a card is open for editing', () => {
    useAdminWorkflowStore.getState().setToEditing(0)

    const { container } = renderCard({
      type: CompletionPeekMomentType.LaterStepDone,
      stepNumber: 1,
      onDeclineAnotherStep: () => undefined,
      onAddAnotherStep: () => undefined,
    })

    expect(container).toBeEmptyDOMElement()
  })
})
