import { useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  createMemoryRouter,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
} from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AdminMultirespondentFormDto,
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  FormWorkflowStepWriteDto,
  MultirespondentFormSettings,
  WorkflowType,
} from 'formsg-shared/types'

import { render } from '~/test-utils'
import { theme } from '~/theme'

import { StepLoginAccordion } from './StepLoginAccordion'

const state = vi.hoisted(() => ({
  update: vi.fn(),
  restrictions: vi.fn(),
  publish: () => {},
  form: {} as AdminMultirespondentFormDto,
}))
vi.mock('~features/admin-form/create/workflow/FormWorkflowService', () => ({
  updateWorkflowStep: (...args: unknown[]) => state.update(...args),
}))
vi.mock('~features/admin-form/create/workflow/mutations', () => ({
  invalidateLoginQueries: async () => state.publish(),
}))
vi.mock('./StepOneLoginRestrictions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./StepOneLoginRestrictions')>()),
  saveStepOneLoginRestrictions: (...args: unknown[]) =>
    state.restrictions(...args),
  StepOneLoginRestrictions: ({
    value,
    onChange,
    isDisabled,
  }: {
    value: { isSingleSubmission: boolean }
    onChange: (value: { isSingleSubmission: boolean }) => void
    isDisabled: boolean
  }) => (
    <label>
      Single submission
      <input
        type="checkbox"
        checked={value.isSingleSubmission}
        disabled={isDisabled}
        onChange={() =>
          onChange({ isSingleSubmission: !value.isSingleSubmission })
        }
      />
    </label>
  ),
}))
const initialForm = () =>
  ({
    _id: 'test',
    authType: FormAuthType.NIL,
    status: FormStatus.Private,
    responseMode: FormResponseMode.Multirespondent,
    lastModified: '2026-11-23T00:00:00.000Z',
    form_fields: [],
    form_logics: [],
    workflow: [
      {
        _id: 'one',
        step_name: 'First',
        workflow_type: WorkflowType.Static,
        edit: [],
        emails: [],
      },
      {
        _id: 'two',
        step_name: 'Second',
        workflow_type: WorkflowType.Static,
        edit: [],
        emails: [],
        auth: { auth_type: FormAuthType.CP, esrvc_id: 'original' },
      },
    ],
  }) as unknown as AdminMultirespondentFormDto
const Harness = () => {
  const [form, setForm] = useState(state.form)
  state.publish = () => setForm({ ...state.form })
  return (
    <StepLoginAccordion
      form={form}
      settings={form as unknown as MultirespondentFormSettings}
    />
  )
}
const renderCards = () =>
  render(
    <ChakraProvider theme={theme}>
      {/* @ts-expect-error missing FC type in old version */}
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <MemoryRouter initialEntries={['/test']}>
          <Routes>
            <Route path="/:formId" element={<Harness />} />
            <Route
              path="/admin/form/test"
              element={<div>Workflow destination</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>,
  )
const card = (name: string) => within(screen.getByRole('region', { name }))
const clickRadio = (name: string, provider: RegExp) =>
  fireEvent.click(card(name).getByRole('radio', { name: provider }), {
    clientX: 1,
    clientY: 1,
  })

beforeEach(() => {
  state.form = initialForm()
  state.restrictions
    .mockReset()
    .mockImplementation(async (_id, _baseline, draft) => {
      state.form = {
        ...state.form,
        isSingleSubmission: draft.isSingleSubmission,
      }
    })
  state.update
    .mockReset()
    .mockImplementation(
      async (_id, index: number, input: FormWorkflowStepWriteDto) => {
        state.form = {
          ...state.form,
          ...(input.first_step_login
            ? {
                authType: input.first_step_login.auth_type,
                esrvcId: input.first_step_login.esrvc_id,
              }
            : {}),
          workflow: state.form.workflow.map((step, at) =>
            at === index
              ? { ...step, ...input, auth: input.auth ?? undefined }
              : step,
          ),
          lastModified: new Date(
            new Date(state.form.lastModified).getTime() + 1000,
          ).toISOString() as AdminMultirespondentFormDto['lastModified'],
        }
      },
    )
})

it('shows every neutral card with editable controls and no collapse, Save or Cancel actions', () => {
  renderCards()
  for (const name of [
    'No login required',
    'Singpass (allows Singpass Myinfo fields)',
    'Corppass (allows Corppass Myinfo fields)',
  ]) {
    expect(card('First').getByRole('radio', { name })).toBeVisible()
  }
  expect(card('Second').getByRole('textbox')).toHaveValue('original')
  expect(
    screen.queryByRole('button', { name: /^(Save|Cancel|First|Second)$/ }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'First' })).not.toHaveAttribute(
    'tabindex',
  )
  expect(screen.getByRole('region', { name: 'Second' })).not.toHaveAttribute(
    'tabindex',
  )
})

it('saves selected providers and uses the refreshed version for another step', async () => {
  renderCards()
  clickRadio('First', /^Corppass/)
  await waitFor(() =>
    expect(
      card('First').getByRole('radio', { name: /^Corppass/ }),
    ).toBeChecked(),
  )
  clickRadio('Second', /No login required/)
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(2))
  expect(state.update.mock.calls[0][2].expected_last_modified).toBe(
    '2026-11-23T00:00:00.000Z',
  )
  expect(state.update.mock.calls[1][2].expected_last_modified).toBe(
    '2026-11-23T00:00:01.000Z',
  )
  expect(card('First').getByRole('radio', { name: /^Corppass/ })).toBeEnabled()
})

it('moves radio focus with arrows and commits only on Enter or Space', async () => {
  const user = userEvent.setup()
  renderCards()
  card('First')
    .getByRole('radio', { name: /No login required/ })
    .focus()
  await user.keyboard('{ArrowDown}')
  expect(state.update).not.toHaveBeenCalled()
  expect(card('First').getByRole('radio', { name: /^Singpass/ })).toHaveFocus()
  await user.keyboard('{Enter}')
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1))
  await waitFor(() =>
    expect(
      card('First').getByRole('radio', { name: /^Singpass/ }),
    ).toBeEnabled(),
  )
  card('First')
    .getByRole('radio', { name: /No login required/ })
    .focus()
  await user.keyboard(' ')
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(2))
})

it('saves trimmed text on blur and Enter, resets invalid or failed changes', async () => {
  const user = userEvent.setup()
  renderCards()
  const input = card('Second').getByRole('textbox')
  await user.clear(input)
  await user.type(input, ' new-id ')
  expect(state.update).not.toHaveBeenCalled()
  await user.tab()
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1))
  expect(state.update.mock.calls[0][2].auth.esrvc_id).toBe('new-id')
  await waitFor(() => expect(input).toBeEnabled())
  await user.clear(input)
  await user.type(input, 'invalid id')
  await user.tab()
  expect(input).toHaveValue('new-id')
  expect(state.update).toHaveBeenCalledTimes(1)
  state.update.mockRejectedValueOnce(new Error('Request failed'))
  await user.clear(input)
  await user.type(input, 'failed{Enter}')
  await waitFor(() => expect(input).toHaveValue('new-id'))
  expect(await card('Second').findByRole('alert')).toHaveTextContent(
    'Request failed',
  )
  await waitFor(() => expect(input).toBeEnabled())
})

it('asks before field consequences, cancels without saving, and sends confirmation on confirm', async () => {
  state.form.form_fields = [
    {
      _id: 'uen',
      title: 'UEN',
      fieldType: BasicField.Uen,
      corppass: { attr: CorppassAttribute.Uen },
    },
  ] as AdminMultirespondentFormDto['form_fields']
  state.form.workflow[1].edit = ['uen']
  const user = userEvent.setup()
  renderCards()
  clickRadio('Second', /No login required/)
  await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
  expect(state.update).not.toHaveBeenCalled()
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: /Cancel/i }),
  )
  expect(card('Second').getByRole('radio', { name: /^Corppass/ })).toBeChecked()
  expect(state.form.workflow[1].edit).toEqual(['uen'])
  clickRadio('Second', /No login required/)
  await user.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: /Delete fields/i,
    }),
  )
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1))
  expect(state.update.mock.calls[0][2]).toMatchObject({
    edit: [],
    delete_auth_field_ids: ['uen'],
    auth: null,
  })
})

it('disables every card until a pending save finishes', async () => {
  let resolve!: () => void
  state.update.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done
      }),
  )
  renderCards()
  clickRadio('First', /^Corppass/)
  await waitFor(() =>
    expect(card('Second').getByRole('textbox')).toBeDisabled(),
  )
  expect(
    card('First').getByRole('radio', { name: /No login required/ }),
  ).toBeDisabled()
  await act(async () => resolve())
  await waitFor(() => expect(card('Second').getByRole('textbox')).toBeEnabled())
})

it('keeps saved login after a restriction failure and allows later changes without replaying login', async () => {
  const user = userEvent.setup()
  renderCards()
  clickRadio('First', /^Corppass/)
  await waitFor(() => expect(card('First').getByRole('checkbox')).toBeEnabled())
  state.restrictions.mockRejectedValueOnce(new Error('Restrictions failed'))
  await user.click(card('First').getByRole('checkbox'))
  expect(await card('First').findByRole('alert')).toHaveTextContent(
    'Restrictions failed',
  )
  expect(card('First').getByRole('radio', { name: /^Corppass/ })).toBeChecked()
  expect(card('First').getByRole('checkbox')).not.toBeChecked()
  await waitFor(() => expect(card('First').getByRole('checkbox')).toBeEnabled())
  await user.click(card('First').getByRole('checkbox'))
  await waitFor(() => expect(card('First').getByRole('checkbox')).toBeChecked())
  expect(state.update).toHaveBeenCalledTimes(1)
  expect(state.restrictions).toHaveBeenCalledTimes(2)
})

it('restores the saved provider after a rejected request and keeps the card editable', async () => {
  renderCards()
  state.update.mockRejectedValueOnce(
    new Error('Form changed. Review the latest version.'),
  )
  clickRadio('Second', /No login required/)
  expect(await card('Second').findByRole('alert')).toHaveTextContent(
    'Form changed',
  )
  expect(card('Second').getByRole('radio', { name: /^Corppass/ })).toBeChecked()
  await waitFor(() =>
    expect(
      card('Second').getByRole('radio', { name: /No login required/ }),
    ).toBeEnabled(),
  )
  clickRadio('Second', /No login required/)
  await waitFor(() =>
    expect(
      card('Second').getByRole('radio', { name: /No login required/ }),
    ).toBeChecked(),
  )
  expect(state.update).toHaveBeenCalledTimes(2)
})

it('keeps public forms read only', () => {
  state.form.status = FormStatus.Public
  renderCards()
  expect(
    card('First').getByRole('radio', { name: /No login required/ }),
  ).toBeDisabled()
  expect(card('Second').getByRole('textbox')).toBeDisabled()
  expect(state.update).not.toHaveBeenCalled()
})

it('saves assistive-technology activation clicks without pointer coordinates', async () => {
  renderCards()
  fireEvent.click(card('First').getByRole('radio', { name: /^Corppass/ }))
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1))
  expect(state.update.mock.calls[0][2].first_step_login.auth_type).toBe(
    FormAuthType.CP,
  )
})

it.each([/Edit your full workflow/, /Go to workflows to add a new step/])(
  'remembers navigation after a text blur starts saving: %s',
  async (link) => {
    const user = userEvent.setup()
    let resolve!: () => void
    state.update.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done
        }),
    )
    renderCards()
    const input = card('Second').getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'updated')
    await user.click(screen.getByRole('button', { name: link }))
    expect(state.update).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Workflow destination')).not.toBeInTheDocument()
    await act(async () => resolve())
    expect(await screen.findByText('Workflow destination')).toBeVisible()
  },
)

it('stays in Settings when the save requested before navigation fails', async () => {
  const user = userEvent.setup()
  let reject!: (error: Error) => void
  state.update.mockImplementationOnce(
    () =>
      new Promise<void>((_done, fail) => {
        reject = fail
      }),
  )
  renderCards()
  const input = card('Second').getByRole('textbox')
  await user.clear(input)
  await user.type(input, 'updated')
  await user.click(
    screen.getByRole('button', { name: /Edit your full workflow/ }),
  )
  await act(async () => reject(new Error('Save failed')))
  expect(await card('Second').findByRole('alert')).toHaveTextContent(
    'Save failed',
  )
  expect(screen.queryByText('Workflow destination')).not.toBeInTheDocument()
})

it('keeps every card mounted while the last step saves with the full-app navigation guard', async () => {
  state.form.workflow.push({
    ...state.form.workflow[0],
    _id: 'three',
    step_name: 'Third',
  })
  let finish!: () => void
  const previousSave = state.update.getMockImplementation()!
  state.update.mockImplementationOnce(async (...args: unknown[]) => {
    await new Promise<void>((resolve) => {
      finish = resolve
    })
    return previousSave(...args)
  })
  const router = createMemoryRouter(
    [{ path: '/:formId', element: <Harness /> }],
    { initialEntries: ['/test'] },
  )
  render(
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  clickRadio('Third', /^Singpass/)
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1))
  expect(
    card('First').getByRole('radio', { name: /No login required/ }),
  ).toBeVisible()
  expect(card('Third').getByRole('radio', { name: /^Singpass/ })).toBeDisabled()
  await act(async () => finish())
  await waitFor(() =>
    expect(
      card('Third').getByRole('radio', { name: /^Singpass/ }),
    ).toBeChecked(),
  )
  expect(router.state.location.pathname).toBe('/test')
  expect(
    screen.getAllByRole('region', { name: /^(First|Second|Third)$/ }),
  ).toHaveLength(3)
})
