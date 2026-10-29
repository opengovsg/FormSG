import { composeStory, Meta, StoryFn } from '@storybook/react-vite'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  AdminFormDto,
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MyInfoAttribute,
} from 'formsg-shared/types'

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

const buildParameters = (
  status: FormStatus,
  overrides: Partial<AdminFormDto> = {},
) => ({
  msw: {
    handlers: {
      default: createFormBuilderMocks({
        responseMode: FormResponseMode.Multirespondent,
        status,
        workflow: [],
        ...overrides,
      } as Partial<AdminFormDto>),
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
  overrides: Partial<AdminFormDto> = {},
) => {
  const story = template(entryPoint)
  story.parameters = buildParameters(status, overrides)
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

describe('DeleteWorkflowModal login check', () => {
  it('retains the sole provider from a later step when deleting the workflow', async () => {
    // Arrange: Step 1 has no login; Step 2's Singpass login fills a Myinfo field
    const Story = buildStory('workflow-card', FormStatus.Private, {
      authType: FormAuthType.NIL,
      form_fields: [
        {
          _id: 'name',
          fieldType: BasicField.ShortText,
          title: 'Name',
          myInfo: { attr: MyInfoAttribute.Name },
        },
      ],
      workflow: [
        { _id: 's1', edit: [] },
        { _id: 's2', edit: ['name'], auth: { auth_type: FormAuthType.MyInfo } },
      ],
    } as unknown as Partial<AdminFormDto>)
    await act(async () => {
      render(<Story />)
    })

    // Assert
    expect(
      await screen.findByText(/The form will keep Singpass authentication/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('All form fields will be kept.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled()
  })
})

describe('mixed authentication workflow deletion', () => {
  const mixedForm = {
    authType: FormAuthType.MyInfo,
    form_fields: [
      {
        _id: 'name',
        title: 'Verified name',
        fieldType: BasicField.ShortText,
        myInfo: { attr: MyInfoAttribute.Name },
      },
      {
        _id: 'uen',
        title: 'Organisation UEN',
        fieldType: BasicField.Uen,
        corppass: { attr: CorppassAttribute.Uen },
      },
    ],
    workflow: [
      { _id: 'one', edit: ['name'] },
      {
        _id: 'two',
        edit: ['uen'],
        auth: { auth_type: FormAuthType.CP, esrvc_id: 'service-a' },
      },
      {
        _id: 'three',
        edit: [],
        auth: { auth_type: FormAuthType.CP, esrvc_id: 'service-b' },
      },
    ],
  } as unknown as Partial<AdminFormDto>

  it('requires provider selection, reviews deleted fields, and allows returning without changing the form', async () => {
    const Story = buildStory('workflow-card', FormStatus.Private, mixedForm)
    await act(async () => {
      render(<Story />)
    })
    const next = await screen.findByRole('button', { name: 'Next' })
    expect(next).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: 'Singpass' }))
    expect(next).toBeEnabled()
    fireEvent.click(next)
    expect(screen.getByText('Organisation UEN')).toBeInTheDocument()
    expect(
      screen.getByText('Historical responses will not be deleted.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('radio', { name: 'Singpass' })).toBeChecked()
    expect(mixedForm.form_fields).toHaveLength(2)
  })

  it('requires an explicit existing Corppass configuration when IDs differ', async () => {
    const Story = buildStory('workflow-card', FormStatus.Private, mixedForm)
    await act(async () => {
      render(<Story />)
    })
    fireEvent.click(await screen.findByRole('radio', { name: 'Corppass' }))
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: 'service-b' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Verified name')).toBeInTheDocument()
    expect(
      screen.getByText(/eligibility list and one-response limit will be reset/),
    ).toBeInTheDocument()
  })
})

it('describes retained legacy Singpass without claiming that restrictions reset', async () => {
  const Story = buildStory('workflow-card', FormStatus.Private, {
    authType: FormAuthType.SP,
    workflow: [{ _id: 'legacy', edit: [] }],
  } as unknown as Partial<AdminFormDto>)
  await act(async () => {
    render(<Story />)
  })
  expect(
    await screen.findByText(/The form will keep Singpass authentication/),
  ).toBeInTheDocument()
  expect(
    screen.queryByText(/eligibility list and one-response limit will be reset/),
  ).not.toBeInTheDocument()
})
