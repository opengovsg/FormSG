import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from '../adminWorkflowStore'
import * as pageStories from '../CreatePageWorkflowTab.stories'
import { AdminEditWorkflowState } from '../types'

const { NoWorkflow, NoWorkflowRedesignOn } = composeStories(pageStories)

const NEW_HEADER = /workflows split your form into steps/i
const NEW_SUBHEADER = /send each step to a different person/i
const OLD_HEADER = /create a workflow to collect responses/i

const GUIDED = { name: /start with guided setup/i }
const MANUAL = { name: /set up manually/i }

describe('the workflow tab intro screen', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  describe('with the redesign flag on', () => {
    const renderIntro = async () => {
      await act(async () => {
        render(<NoWorkflowRedesignOn />)
      })
      await screen.findByText(NEW_HEADER, {}, { timeout: 10000 })
    }

    it('says what a workflow does, and offers both ways in', async () => {
      await renderIntro()

      expect(screen.getByText(NEW_SUBHEADER)).toBeInTheDocument()
      expect(screen.getByRole('button', GUIDED)).toBeInTheDocument()
      expect(screen.getByRole('button', MANUAL)).toBeInTheDocument()
    })

    it('drops the heading that named the feature and the guide link', async () => {
      await renderIntro()

      expect(screen.queryByText(OLD_HEADER)).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: /learn how to create a workflow/i }),
      ).not.toBeInTheDocument()
    })

    it('illustrates a form rather than borrowing the real title', async () => {
      await renderIntro()

      expect(screen.getByText('My form')).toBeInTheDocument()
    })

    it('shows the logo a real form falls back to', async () => {
      await renderIntro()

      expect(screen.getByAltText('FormSG')).toBeInTheDocument()
    })

    it.each([
      ['guided', GUIDED],
      ['manual', MANUAL],
    ])('starts a step from the %s action', async (_label, action) => {
      const user = userEvent.setup()
      await renderIntro()

      await act(async () => {
        await user.click(screen.getByRole('button', action))
      })

      expect(useAdminWorkflowStore.getState().createOrEditData).toEqual({
        state: AdminEditWorkflowState.CreatingStep,
      })
    })
  })

  describe('with the redesign flag off', () => {
    it('keeps the pre-redesign screen whole', async () => {
      await act(async () => {
        render(<NoWorkflow />)
      })

      expect(
        await screen.findByText(OLD_HEADER, {}, { timeout: 10000 }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: /learn how to create a workflow/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create workflow/i }),
      ).toBeInTheDocument()
      expect(screen.queryByText(NEW_HEADER)).not.toBeInTheDocument()
    })
  })
})
