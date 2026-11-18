import { useEffect } from 'react'
import {
  Location,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { composeStory } from '@storybook/react-vite'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { featureFlags } from 'formsg-shared/constants'
import {
  AdminDashboardFormMetaDto,
  AdminFormDto,
  FormPermissionsDto,
  FormResponseMode,
  FormStatus,
} from 'formsg-shared/types/form/form'

import {
  getAdminFormCollaborators,
  getAdminFormView,
} from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import { WorkspaceFormRow } from '~features/workspace/components/WorkspaceFormRow/WorkspaceFormRow'

import { AdminFormLayout } from './AdminFormLayout'

// The row's action menu needs the whole workspace page around it, and plays
// no part in opening a form.
vi.mock('~features/workspace/components/WorkspaceFormRow/RowActions', () => ({
  RowActions: () => null,
}))

const FORM_ID = '61540ece3d4a6e50ac0cc6ff'
const QUESTION = 'Before FormSG, how did you collect this?'
// Within the period the question covers (from 1 Jul 2025, Singapore time).
const RECENT_FORM = {
  created: '2026-01-05T07:46:29.388Z',
} as Partial<AdminFormDto>

const dashboardRow = {
  _id: FORM_ID,
  title: 'Old storage form',
  status: FormStatus.Private,
  responseMode: FormResponseMode.Encrypt,
  admin: { email: 'admin@example.com' },
  lastModified: '2026-01-05T07:46:29.388Z',
} as AdminDashboardFormMetaDto

// The latest location, i.e. the history entry a browser reload would keep.
let lastLocation: Location
const TrackLocation = () => {
  const location = useLocation()
  useEffect(() => {
    lastLocation = location
  }, [location])
  return null
}

const renderDashboardAndForm = async ({
  handlers = [],
  startAt = '/dashboard',
}: { handlers?: unknown[]; startAt?: string | Partial<Location> } = {}) => {
  const growthbook = new GrowthBook({
    features: {
      [featureFlags.enablePaperTrackingSetUpPage]: { defaultValue: true },
    },
  })
  const Story = composeStory(
    {
      render: () => (
        <GrowthBookProvider growthbook={growthbook}>
          <MemoryRouter initialEntries={[startAt]}>
            <TrackLocation />
            <Routes>
              <Route
                path="/dashboard"
                element={<WorkspaceFormRow formMeta={dashboardRow} />}
              />
              <Route path="/admin/form/:formId" element={<AdminFormLayout />}>
                <Route index element={<div>Builder</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GrowthBookProvider>
      ),
      parameters: {
        msw: {
          handlers: {
            // Earlier handlers win, so a test's own handlers come first.
            default: [
              ...handlers,
              getAdminFormView({
                mode: FormResponseMode.Encrypt,
                overrides: RECENT_FORM,
              }),
              getUser(),
              getAdminFormCollaborators(),
            ],
          },
        },
      },
    },
    { title: 'Tests/FormOriginFromDashboard' },
  )
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(<Story />)
  })
  return result
}

describe('Asking a form origin when opened from the dashboard', () => {
  it('asks the owner when they click a storage form with no origin', async () => {
    await renderDashboardAndForm()

    await userEvent.click(await screen.findByText('Old storage form'))

    expect(
      await screen.findByRole('dialog', { name: QUESTION }),
    ).toBeInTheDocument()
    expect(screen.getByText('Builder')).toBeInTheDocument()
  })

  it.each([
    {
      who: 'a viewer',
      form: {
        admin: { email: 'owner@example.com' },
        permissionList: [{ email: 'admin@example.com', write: false }],
      },
      collaborators: [{ email: 'admin@example.com', write: false }],
    },
    {
      who: 'the owner of a form that already has an origin',
      form: { metadata: { formOrigins: { value: ['paper'] } } },
      collaborators: [],
    },
    {
      who: 'about a form created before 1 Jul 2025',
      // 30 Jun 2025, 11:59:59 pm in Singapore.
      form: { created: '2025-06-30T15:59:59.000Z' },
      collaborators: [],
    },
  ])('does not ask $who', async ({ form, collaborators }) => {
    await renderDashboardAndForm({
      handlers: [
        getAdminFormView({
          mode: FormResponseMode.Encrypt,
          overrides: { ...RECENT_FORM, ...form } as Partial<AdminFormDto>,
        }),
        getAdminFormCollaborators({
          overrides: collaborators as FormPermissionsDto,
        }),
      ],
    })

    await userEvent.click(await screen.findByText('Old storage form'))

    // The navbar shows the title once the form has loaded.
    await screen.findByText('Test form title')
    expect(
      screen.queryByRole('dialog', { name: QUESTION }),
    ).not.toBeInTheDocument()
  })

  it('does not ask again when the page is reloaded', async () => {
    const { unmount } = await renderDashboardAndForm()
    await userEvent.click(await screen.findByText('Old storage form'))
    await screen.findByRole('dialog', { name: QUESTION })

    // A browser reload keeps the current history entry, state included.
    unmount()
    await renderDashboardAndForm({ startAt: lastLocation })

    await screen.findByText('Test form title')
    expect(
      screen.queryByRole('dialog', { name: QUESTION }),
    ).not.toBeInTheDocument()
  })

  it('saves the chosen answer on Submit and closes the question', async () => {
    const savedBodies: unknown[] = []
    await renderDashboardAndForm({
      handlers: [
        http.put(
          `/api/v3/admin/forms/${FORM_ID}/form-origins`,
          async ({ request }) => {
            const body = await request.json()
            savedBodies.push(body)
            return HttpResponse.json(body)
          },
        ),
      ],
    })
    await userEvent.click(await screen.findByText('Old storage form'))
    await screen.findByRole('dialog', { name: QUESTION })

    await userEvent.click(screen.getByRole('radio', { name: 'On paper' }))
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(savedBodies).toEqual([{ formOrigins: { value: ['paper'] } }]),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: QUESTION }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Builder')).toBeInTheDocument()
  })

  it('saves nothing on Cancel and closes the question', async () => {
    const saveRequests: unknown[] = []
    await renderDashboardAndForm({
      handlers: [
        http.put(
          `/api/v3/admin/forms/${FORM_ID}/form-origins`,
          ({ request }) => {
            saveRequests.push(request)
            return HttpResponse.json({})
          },
        ),
      ],
    })
    await userEvent.click(await screen.findByText('Old storage form'))
    await screen.findByRole('dialog', { name: QUESTION })

    await userEvent.click(screen.getByRole('radio', { name: 'Digitally' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: QUESTION }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Builder')).toBeInTheDocument()
    expect(saveRequests).toHaveLength(0)
  })
})
