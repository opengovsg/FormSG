import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { composeStory } from '@storybook/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { getAdminFormView } from '~/mocks/msw/handlers/admin-form'

import { AdminFormLayout } from './AdminFormLayout'

it('targets the admin form and clears formId when navigating to the workspace', async () => {
  const growthbook = new GrowthBook({
    attributes: { adminEmail: 'editor@example.com', adminAgency: 'OGP' },
  })
  const Story = composeStory(
    {
      render: () => (
        <GrowthBookProvider growthbook={growthbook}>
          <MemoryRouter initialEntries={['/admin/form/12345']}>
            <Routes>
              <Route path="/admin/form/:formId" element={<AdminFormLayout />}>
                <Route
                  index
                  element={<Link to="/workspace">Go to workspace</Link>}
                />
              </Route>
              <Route path="/workspace" element={<div>Workspace reached</div>} />
            </Routes>
          </MemoryRouter>
        </GrowthBookProvider>
      ),
      parameters: { msw: { handlers: { default: [getAdminFormView()] } } },
    },
    { title: 'Tests/AdminFormTargeting' },
  )
  await act(async () => {
    render(<Story />)
  })
  await screen.findByRole('link', { name: 'Go to workspace' })
  expect(growthbook.getAttributes()).toEqual({
    formId: '12345',
    adminEmail: 'editor@example.com',
    adminAgency: 'OGP',
  })
  await userEvent.click(screen.getByRole('link', { name: 'Go to workspace' }))
  await screen.findByText('Workspace reached')
  await waitFor(() =>
    expect(growthbook.getAttributes()).toEqual({
      adminEmail: 'editor@example.com',
      adminAgency: 'OGP',
    }),
  )
})
