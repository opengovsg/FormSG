import { QueryClient, QueryClientProvider } from 'react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormStatus,
  MultirespondentFormSettings,
  WorkflowType,
} from 'formsg-shared/types'

import { render } from '~/test-utils'

import { StepAuthSettingsEditor } from './StepAuthSettingsEditor'

const state = vi.hoisted(() => ({ update: vi.fn().mockResolvedValue([]) }))
vi.mock('~features/admin-form/create/workflow/FormWorkflowService', () => ({
  updateWorkflowStep: state.update,
}))
vi.mock('./StepOneLoginRestrictions', () => ({
  StepOneLoginRestrictions: () => null,
  createStepOneLoginRestrictionsDraft: () => ({}),
  saveStepOneLoginRestrictions: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key.split('.').at(-1) }),
}))

it('keeps the saved first-step SP login when Settings switches away and back before saving', async () => {
  const step = {
    _id: 'one',
    workflow_type: WorkflowType.Static,
    edit: [],
    emails: [],
    step_name: 'Applicant',
  } as const
  const form = {
    authType: FormAuthType.SP,
    status: FormStatus.Private,
    form_fields: [],
    form_logics: [],
    workflow: [step],
  } as unknown as AdminMultirespondentFormDto
  render(
    // @ts-expect-error react-query v3 provider types omit React 18 children, as in App.tsx.
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={['/form/test-form']}>
        <Routes>
          <Route
            path="/form/:formId"
            element={
              <StepAuthSettingsEditor
                form={form}
                settings={
                  { authType: FormAuthType.SP } as MultirespondentFormSettings
                }
                step={form.workflow[0]}
                stepIndex={0}
                onClose={vi.fn()}
                onDirtyChange={vi.fn()}
                onSavingChange={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByRole('radio', { name: /corppass / }))
  fireEvent.click(screen.getByRole('radio', { name: /^singpass / }))
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  await waitFor(() => expect(state.update).toHaveBeenCalled())
  expect(state.update.mock.calls[0][2]).not.toHaveProperty('first_step_login')
})
