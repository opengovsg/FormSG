import { composeStory, Meta, StoryFn } from '@storybook/react'
import { act, render, screen, waitFor } from '@testing-library/react'

import { FormResponseMode, FormStatus } from 'formsg-shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { useAdminForm } from '~features/admin-form/common/queries'

import { DeleteWorkflowModal } from './DeleteWorkflowModal'

/**
 * Deliberately not composed from DeleteWorkflowModal.stories: those mock a form
 * with no `workflow` at all, so `useWorkflowMutations` throws before the modal
 * renders. An empty array is enough to get past that guard, and focus does not
 * depend on the steps themselves.
 */
const meta = {
  title: 'Features/AdminForm/Workflow/DeleteWorkflowModalFocus',
  component: DeleteWorkflowModal,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
} as Meta

const buildParameters = (status: FormStatus) => ({
  msw: {
    handlers: {
      default: createFormBuilderMocks({
        responseMode: FormResponseMode.Multirespondent,
        status,
        workflow: [],
      }),
    },
  },
})

/**
 * The modal reads the workflow through useWorkflowMutations, which throws while
 * the form query is still in flight. WorkflowContent never hits that because it
 * returns null until the form has loaded; this mirrors that guard so the test
 * exercises the modal the way the app actually mounts it.
 */
const Harness = ({
  entryPoint,
}: {
  entryPoint: 'workflow-card' | 'first-step'
}) => {
  const { isLoading } = useAdminForm()
  if (isLoading) return null
  return (
    <DeleteWorkflowModal
      isOpen
      onClose={() => undefined}
      entryPoint={entryPoint}
    />
  )
}

const template =
  (entryPoint: 'workflow-card' | 'first-step'): StoryFn =>
  () => <Harness entryPoint={entryPoint} />

const buildStory = (
  entryPoint: 'workflow-card' | 'first-step',
  status: FormStatus,
) => {
  const story = template(entryPoint)
  story.parameters = buildParameters(status)
  return composeStory(story, meta)
}

/**
 * Focus belongs on the dialog, not on any button: the Button and CloseButton
 * themes paint `_focus` rather than `_focusVisible`, so whichever button holds
 * focus shows its ring the moment the modal opens, which reads as though an
 * action has already been chosen.
 *
 * Scope, so nobody reads more into a green run than is there: jsdom does not
 * reproduce the browser default this fixes. react-focus-lock picks the first
 * tabbable element in a real browser, which is the close button, but without
 * layout it falls back to the dialog, so these pass whether or not
 * `initialFocusRef` is set. What they do catch is the ref being pointed at a
 * button, which is the regression worth pinning, since a ring on Cancel or
 * Delete is just as wrong as one on the X. The browser behaviour itself needs
 * a manual check.
 */
describe('DeleteWorkflowModal initial focus', () => {
  it.each([
    ['from the workflow card', 'workflow-card' as const, FormStatus.Private],
    ['from step 1', 'first-step' as const, FormStatus.Private],
    ['when the form is open', 'workflow-card' as const, FormStatus.Public],
  ])(
    'rests on the dialog rather than any button %s',
    async (_label, entryPoint, status) => {
      // Arrange
      const Story = buildStory(entryPoint, status)
      await act(async () => {
        render(<Story />)
      })

      // Assert
      await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())
      for (const button of screen.getAllByRole('button')) {
        expect(button).not.toHaveFocus()
      }
    },
  )
})
