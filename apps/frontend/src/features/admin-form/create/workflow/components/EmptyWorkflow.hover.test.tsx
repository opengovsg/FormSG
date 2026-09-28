import { composeStories } from '@storybook/react'
import { act, fireEvent, render, screen } from '@testing-library/react'

import * as pageStories from '../CreatePageWorkflowTab.stories'

import { INTRO_ILLUSTRATION_TEST_ID } from './EmptyWorkflow'
import {
  ILLUSTRATION_FORM_LAYER_TEST_ID,
  ILLUSTRATION_STEPS_LAYER_TEST_ID,
} from './FormToWorkflowIllustration'

const { NoWorkflowRedesignOn } = composeStories(pageStories)

const INTRO_HEADER = /start creating a workflow for your form/i

describe('the intro card illustration on hover', () => {
  const mountIntro = async () => {
    await act(async () => {
      render(<NoWorkflowRedesignOn />)
    })
    await screen.findByText(INTRO_HEADER, {}, { timeout: 10000 })
    return screen.getByTestId(INTRO_ILLUSTRATION_TEST_ID)
  }

  const showing = () => ({
    form: screen
      .getByTestId(ILLUSTRATION_FORM_LAYER_TEST_ID)
      .getAttribute('aria-hidden'),
    steps: screen
      .getByTestId(ILLUSTRATION_STEPS_LAYER_TEST_ID)
      .getAttribute('aria-hidden'),
  })

  it('morphs to the steps while hovered, and back on leave', async () => {
    const illustration = await mountIntro()

    expect(showing()).toEqual({ form: 'false', steps: 'true' })

    await act(async () => {
      fireEvent.mouseEnter(illustration)
    })
    expect(showing()).toEqual({ form: 'true', steps: 'false' })

    await act(async () => {
      fireEvent.mouseLeave(illustration)
    })
    expect(showing()).toEqual({ form: 'false', steps: 'true' })
  })

  it('keeps both layers mounted, so the card cannot resize under the pointer', async () => {
    await mountIntro()

    expect(
      screen.getByTestId(ILLUSTRATION_FORM_LAYER_TEST_ID),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(ILLUSTRATION_STEPS_LAYER_TEST_ID),
    ).toBeInTheDocument()
  })
})
